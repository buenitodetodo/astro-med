import { describe, expect, it, vi } from 'vitest';
import worker from '../worker';

const clave = 'clave-de-prueba-larga';
const base = 'https://panel.test';

const crear_env = (con_clave = true) => {
  const API = { fetch: vi.fn(async () => Response.json({ ok: true })) };
  const ASSETS = { fetch: vi.fn(async () => new Response('<html></html>')) };
  return { API, ASSETS, ...(con_clave ? { PANEL_CLAVE: clave } : {}) };
};

const pedir = (env: ReturnType<typeof crear_env>, ruta: string, opciones: RequestInit = {}) => worker.fetch(new Request(base + ruta, opciones), env);

const entrar = async (env: ReturnType<typeof crear_env>, intento = clave) =>
  pedir(env, '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clave: intento }) });

const galleta = (respuesta: Response) => respuesta.headers.get('Set-Cookie')!.split(';')[0]!;

describe('panel lock', () => {
  it('refuses the simulator without a session and never reaches the API', async () => {
    const env = crear_env();
    const respuesta = await pedir(env, '/v1/sim/crew');
    expect(respuesta.status).toBe(401);
    expect(env.API.fetch).not.toHaveBeenCalled();
  });

  it('rejects a wrong password', async () => {
    const env = crear_env();
    const respuesta = await entrar(env, 'otra');
    expect(respuesta.status).toBe(401);
    expect(respuesta.headers.get('Set-Cookie')).toBeNull();
  });

  it('opens a session with the right password and lets the simulator through', async () => {
    const env = crear_env();
    const respuesta = await entrar(env);
    expect(respuesta.status).toBe(200);
    const cabecera = respuesta.headers.get('Set-Cookie')!;
    for (const atributo of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/']) expect(cabecera).toContain(atributo);
    const sesion = await pedir(env, '/auth/session', { headers: { Cookie: galleta(respuesta) } });
    expect(await sesion.json()).toEqual({ ok: true });
    const sim = await pedir(env, '/v1/sim/crew', { headers: { Cookie: galleta(respuesta) } });
    expect(sim.status).toBe(200);
    expect(env.API.fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects a tampered or expired session', async () => {
    const env = crear_env();
    const valida = galleta(await entrar(env));
    const [nombre, valor] = valida.split('=');
    const [vence, firma] = valor!.split('.');
    const alterada = `${nombre}=${Number(vence) + 999999}.${firma}`;
    expect((await pedir(env, '/v1/sim/crew', { headers: { Cookie: alterada } })).status).toBe(401);
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 13 * 3600_000);
    expect((await pedir(env, '/v1/sim/crew', { headers: { Cookie: valida } })).status).toBe(401);
    vi.useRealTimers();
  });

  it('a session stops working when the password changes', async () => {
    const env = crear_env();
    const vieja = galleta(await entrar(env));
    const otra_env = { ...env, PANEL_CLAVE: 'una-clave-nueva-distinta' };
    expect((await pedir(otra_env, '/v1/sim/crew', { headers: { Cookie: vieja } })).status).toBe(401);
  });

  it('stays locked when no password is configured', async () => {
    const env = crear_env(false);
    expect((await pedir(env, '/v1/sim/crew')).status).toBe(503);
    expect((await entrar(env, '')).status).toBe(503);
    expect(env.API.fetch).not.toHaveBeenCalled();
  });

  it('logs out by clearing the session', async () => {
    const env = crear_env();
    const salida = await pedir(env, '/auth/logout', { method: 'POST' });
    expect(salida.headers.get('Set-Cookie')).toContain('Max-Age=0');
  });

  it('keeps the other API routes closed and serves the page', async () => {
    const env = crear_env();
    expect((await pedir(env, '/v1/me')).status).toBe(404);
    expect((await pedir(env, '/')).status).toBe(200);
  });
});
