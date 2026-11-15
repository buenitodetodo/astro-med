type Binding = { fetch(request: Request): Promise<Response> };
type Env = { ASSETS: Binding; API: Binding; PANEL_CLAVE?: string };

const nombre_galleta = 'panel_sesion';
const duracion_ms = 12 * 3600_000;
const espera_por_fallo_ms = 600;

const codificar = new TextEncoder();

const firmar = async (clave: string, texto: string) => {
  const llave = await crypto.subtle.importKey('raw', codificar.encode(clave), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const firma = new Uint8Array(await crypto.subtle.sign('HMAC', llave, codificar.encode(texto)));
  return [...firma].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const iguales = async (a: string, b: string) => {
  const [resumen_a, resumen_b] = await Promise.all(
    [a, b].map(async (texto) => new Uint8Array(await crypto.subtle.digest('SHA-256', codificar.encode(texto)))),
  );
  let diferencia = 0;
  for (let indice = 0; indice < resumen_a!.length; indice += 1) diferencia |= resumen_a![indice]! ^ resumen_b![indice]!;
  return diferencia === 0;
};

const leer_galleta = (request: Request) =>
  (request.headers.get('Cookie') ?? '')
    .split(';')
    .map((parte) => parte.trim())
    .find((parte) => parte.startsWith(`${nombre_galleta}=`))
    ?.slice(nombre_galleta.length + 1);

const sesion_valida = async (request: Request, clave: string) => {
  const valor = leer_galleta(request);
  const [vence, firma] = valor?.split('.') ?? [];
  if (!vence || !firma || !/^\d+$/.test(vence) || Number(vence) < Date.now()) return false;
  return iguales(firma, await firmar(clave, vence));
};

const galleta = (valor: string, segundos: number) =>
  `${nombre_galleta}=${valor}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${segundos}`;

const bloqueado = () => Response.json({ error: 'panel_locked' }, { status: 503 });
const no_autorizado = () => Response.json({ error: 'unauthorized' }, { status: 401 });

const entrar = async (request: Request, clave: string) => {
  const datos = (await request.json().catch(() => null)) as { clave?: unknown } | null;
  const intento = typeof datos?.clave === 'string' ? datos.clave : '';
  if (!(await iguales(intento, clave))) {
    await new Promise((resolver) => setTimeout(resolver, espera_por_fallo_ms));
    return no_autorizado();
  }
  const vence = String(Date.now() + duracion_ms);
  return Response.json({ ok: true }, { headers: { 'Set-Cookie': galleta(`${vence}.${await firmar(clave, vence)}`, duracion_ms / 1000) } });
};

export default {
  async fetch(request: Request, env: Env) {
    const ruta = new URL(request.url).pathname;
    const clave = env.PANEL_CLAVE ?? '';

    if (ruta === '/auth/logout' && request.method === 'POST') return Response.json({ ok: true }, { headers: { 'Set-Cookie': galleta('', 0) } });
    if (ruta === '/auth/login' && request.method === 'POST') return clave ? entrar(request, clave) : bloqueado();
    if (ruta === '/auth/session') return Response.json({ ok: clave ? await sesion_valida(request, clave) : false });

    if (ruta.startsWith('/v1/sim/')) {
      if (!clave) return bloqueado();
      return (await sesion_valida(request, clave)) ? env.API.fetch(request) : no_autorizado();
    }
    if (ruta.startsWith('/v1/')) return Response.json({ error: 'not_found' }, { status: 404 });
    return env.ASSETS.fetch(request);
  },
};
