export type Mensaje = { role: 'system' | 'user' | 'assistant'; content: string };

export type ConfigModelos = {
  url: string;
  url_medico: string;
  url_chat: string;
  razonamiento: string;
  medico: string;
  chat: string;
  temperatura: number;
  limite_ms: number;
  cabeceras: Record<string, string>;
};

export type Pregunta = {
  modelo: string;
  mensajes: Mensaje[];
  esquema?: Record<string, unknown>;
  temperatura: number;
};

export class ErrorModelo extends Error {}

const limpiar_url = (url: string) => url.trim().replace(/\/+$/, '');

export const leer_config = (env: Env): ConfigModelos => ({
  url: limpiar_url(env.LMSTUDIO_URL || 'http://localhost:1234/v1'),
  url_medico: limpiar_url(env.LMSTUDIO_MEDICO_URL || env.LMSTUDIO_URL || 'http://localhost:1234/v1'),
  url_chat: limpiar_url(env.LMSTUDIO_CHAT_URL || env.LMSTUDIO_URL || 'http://localhost:1234/v1'),
  razonamiento: env.MODELO_RAZONAMIENTO || 'microsoft/phi-4-reasoning',
  medico: env.MODELO_MEDICO || 'medgemma-4b-it',
  chat: env.MODELO_CHAT || 'google/gemma-3n-e4b',
  temperatura: Number(env.TEMPERATURA || 0.7),
  limite_ms: Number(env.LIMITE_RONDA_SEGUNDOS || 300) * 1000,
  cabeceras:
    env.LMSTUDIO_ACCESS_ID && env.LMSTUDIO_ACCESS_SECRET
      ? { 'CF-Access-Client-Id': env.LMSTUDIO_ACCESS_ID, 'CF-Access-Client-Secret': env.LMSTUDIO_ACCESS_SECRET }
      : {},
});

const pedir_a_lmstudio = async (config: ConfigModelos, ruta: string, opciones: RequestInit, limite_ms: number) => {
  try {
    return await fetch(`${config.url}${ruta}`, {
      ...opciones,
      headers: { ...config.cabeceras, ...(opciones.headers as Record<string, string> | undefined) },
      signal: AbortSignal.timeout(limite_ms),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new ErrorModelo(`LM Studio did not answer within ${limite_ms / 1000} s`);
    }
    throw new ErrorModelo(`Could not connect to LM Studio at ${config.url}`);
  }
};

export const preguntar_lmstudio = async (config: ConfigModelos, { modelo, mensajes, esquema, temperatura }: Pregunta) => {
  const respuesta = await pedir_a_lmstudio(
    config,
    '/chat/completions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelo,
        messages: mensajes,
        temperature: temperatura,
        stream: false,
        ...(esquema ? { response_format: { type: 'json_schema', json_schema: { name: 'respuesta_doctor', strict: true, schema: esquema } } } : {}),
      }),
    },
    config.limite_ms,
  );
  const texto = await respuesta.text();
  if (!respuesta.ok) throw new ErrorModelo(`LM Studio answered ${respuesta.status} with ${modelo}: ${texto.slice(0, 300)}`);

  let datos: { choices?: { message?: { content?: string | null } }[] };
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new ErrorModelo(`LM Studio sent a response that is not JSON with ${modelo}`);
  }
  const contenido = datos.choices?.[0]?.message?.content;
  if (!contenido) throw new ErrorModelo(`LM Studio answered without content with ${modelo}`);
  return contenido;
};

export const listar_modelos_lmstudio = async (config: ConfigModelos) => {
  const respuesta = await pedir_a_lmstudio(config, '/models', {}, 5000);
  if (!respuesta.ok) throw new ErrorModelo(`LM Studio answered ${respuesta.status}`);
  const datos = (await respuesta.json()) as { data?: { id: string }[] };
  return (datos.data ?? []).map((modelo) => modelo.id);
};

export const config_del_chat = (config: ConfigModelos): ConfigModelos => ({ ...config, url: config.url_chat });

export const config_del_medico = (config: ConfigModelos): ConfigModelos => ({ ...config, url: config.url_medico });

export const describir_error =(error: unknown) => (error instanceof Error ? error.message : String(error));

export const quitar_razonamiento = (texto: string) => {
  const sin_bloques = texto.replace(/<think>[\s\S]*?<\/think>/gi, '');
  const cierre = sin_bloques.toLowerCase().lastIndexOf('</think>');
  return (cierre === -1 ? sin_bloques : sin_bloques.slice(cierre + '</think>'.length)).trim();
};
