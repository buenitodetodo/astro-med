import { z } from 'zod';
import { buscar_condicion, catalogo, fuera_del_catalogo } from './content';
import { quitar_razonamiento, type Mensaje } from './models';
import { votacion } from './thresholds';

const ids_validos: [string, ...string[]] = [...catalogo.condiciones.map((condicion) => condicion.id), fuera_del_catalogo].toSorted(
  (a, b) => Number(a === fuera_del_catalogo) - Number(b === fuera_del_catalogo),
) as [string, ...string[]];

export const respuesta_ronda_schema = z.object({
  condicion_id: z.enum(ids_validos),
  condicion: z.string().min(1).max(200),
  urgencia: z.number().int().min(1).max(3),
  acciones: z.array(z.string().min(1).max(300)).length(3),
  que_no_hacer: z.array(z.string().min(1).max(300)).min(1).max(5),
  razon: z.string().min(1).max(800),
});

export type RespuestaRonda = z.infer<typeof respuesta_ronda_schema>;

export const esquema_respuesta: Record<string, unknown> = (() => {
  const { $schema: _esquema, ...esquema } = z.toJSONSchema(respuesta_ronda_schema, { target: 'draft-7' }) as Record<string, unknown>;
  return { ...esquema, additionalProperties: false };
})();

export type Ronda = { ok: true; respuesta: RespuestaRonda } | { ok: false; error: string; conexion: boolean };

const instrucciones = [
  'You are the medical assistant of a space mission crew. You support the flight surgeon on Earth; you do not replace them.',
  'Read the case and choose the most likely condition from the catalog.',
  'The case may be written in any language. Read it carefully before choosing.',
  'What the crew reports (what is happening and the symptoms) matters most. The watcher alerts describe the previous days and only add context.',
  'The condition must match the body part and how it happened. Never choose a condition of a different body part: a leg, knee or ankle injury is never a wrist, neck or head condition.',
  `If no catalog condition matches that body part and mechanism, use condicion_id "${fuera_del_catalogo}" and write the name of the condition you think it is in "condicion". Choosing it is correct, not a failure: the case goes to the flight surgeon.`,
  'urgencia: 1 = can wait for the answer from Earth; 2 = treat today; 3 = treat immediately.',
  'acciones: exactly 3 concrete actions the crew can take now.',
  'que_no_hacer: what the crew must NOT do.',
  'razon: explain in a few lines why you chose that condition.',
  'Do not give medication doses or amounts: the program computes the numbers.',
  'Answer only with the requested JSON, in English.',
].join('\n');

export const armar_mensajes = (caso_texto: string): Mensaje[] => [
  {
    role: 'user',
    content: [
      instrucciones,
      '',
      'Condition catalog (id: name):',
      ...catalogo.condiciones.map((condicion) => `- ${condicion.id}: ${condicion.nombre}`),
      '',
      'Case:',
      caso_texto,
    ].join('\n'),
  },
];

const extraer_json = (texto_original: string): unknown => {
  const texto = quitar_razonamiento(texto_original);
  const candidatos = [texto, texto.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, '')];
  const inicio = texto.indexOf('{');
  const fin = texto.lastIndexOf('}');
  if (inicio !== -1 && fin > inicio) candidatos.push(texto.slice(inicio, fin + 1));
  for (const candidato of candidatos) {
    try {
      return JSON.parse(candidato);
    } catch {}
  }
  return undefined;
};

export const leer_ronda = (texto: string): Ronda => {
  const json = extraer_json(texto);
  if (json === undefined) return { ok: false, error: 'The answer is not JSON', conexion: false };
  const resultado = respuesta_ronda_schema.safeParse(json);
  if (resultado.success) return { ok: true, respuesta: resultado.data };
  const problemas = resultado.error.issues.map((issue) => `${issue.path.join('.') || 'answer'}: ${issue.message}`);
  return { ok: false, error: `Invalid format (${problemas.join('; ')})`, conexion: false };
};

const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const clave_de = (respuesta: RespuestaRonda) =>
  respuesta.condicion_id === fuera_del_catalogo ? `${fuera_del_catalogo}:${normalizar(respuesta.condicion)}` : respuesta.condicion_id;

const nombre_de = (respuesta: RespuestaRonda) => buscar_condicion(respuesta.condicion_id)?.nombre ?? respuesta.condicion;

type Opcion = { clave: string; condicion_id: string; nombre: string; votos: number };

const contar = (rondas: Ronda[]) => {
  const opciones = new Map<string, Opcion>();
  for (const ronda of rondas) {
    if (!ronda.ok) continue;
    const clave = clave_de(ronda.respuesta);
    const opcion = opciones.get(clave) ?? { clave, condicion_id: ronda.respuesta.condicion_id, nombre: nombre_de(ronda.respuesta), votos: 0 };
    opcion.votos += 1;
    opciones.set(clave, opcion);
  }
  return [...opciones.values()].toSorted((a, b) => b.votos - a.votos);
};

const elegir_urgencia = (respuestas: RespuestaRonda[]) => {
  const conteo = new Map<number, number>();
  for (const respuesta of respuestas) conteo.set(respuesta.urgencia, (conteo.get(respuesta.urgencia) ?? 0) + 1);
  return [...conteo.entries()].toSorted((a, b) => b[1] - a[1] || b[0] - a[0])[0]?.[0] ?? 3;
};

const resumir_modelo = (rondas: Ronda[], opciones: Opcion[]) => {
  const errores = rondas.flatMap((ronda) => (ronda.ok ? [] : [ronda.error]));
  return {
    ganador: opciones[0]?.nombre ?? null,
    votos_ganador: opciones[0]?.votos ?? 0,
    rondas_validas: rondas.length - errores.length,
    rondas_fallidas: errores.length,
    errores: [...new Set(errores)].slice(0, 3),
    opciones: opciones.map((opcion) => ({ nombre: opcion.nombre, votos: opcion.votos })),
  };
};

export type Nivel = 'alta' | 'media' | 'dudosa';

export const decidir = (rondas_razonamiento: Ronda[], rondas_medico: Ronda[]) => {
  const opciones_razonamiento = contar(rondas_razonamiento);
  const opciones_medico = contar(rondas_medico);
  const opciones_combinadas = contar([...rondas_razonamiento, ...rondas_medico]);
  const primera_combinada = opciones_combinadas[0];
  if (!primera_combinada) return null;

  const ganador_razonamiento = opciones_razonamiento[0];
  const ganador_medico = opciones_medico[0];
  const de_acuerdo = ganador_razonamiento !== undefined && ganador_medico !== undefined && ganador_razonamiento.clave === ganador_medico.clave;
  const votos_minimos = de_acuerdo ? Math.min(ganador_razonamiento.votos, ganador_medico.votos) : 0;
  const nivel: Nivel = !de_acuerdo
    ? 'dudosa'
    : votos_minimos >= votacion.votos_alta.valor
      ? 'alta'
      : votos_minimos >= votacion.votos_media.valor
        ? 'media'
        : 'dudosa';

  const principal = (de_acuerdo && opciones_combinadas.find((opcion) => opcion.clave === ganador_razonamiento.clave)) || primera_combinada;
  const segunda = opciones_combinadas.find((opcion) => opcion.clave !== principal.clave);

  const describir_opcion = (opcion: Opcion) => ({
    condicion_id: opcion.condicion_id,
    nombre: opcion.nombre,
    en_catalogo: opcion.condicion_id !== fuera_del_catalogo,
    votos_razonamiento: opciones_razonamiento.find((otra) => otra.clave === opcion.clave)?.votos ?? 0,
    votos_medico: opciones_medico.find((otra) => otra.clave === opcion.clave)?.votos ?? 0,
  });

  const respuestas_de = (rondas: Ronda[]) =>
    rondas.flatMap((ronda) => (ronda.ok && clave_de(ronda.respuesta) === principal.clave ? [ronda.respuesta] : []));
  const respuestas_principal = [...respuestas_de(rondas_razonamiento), ...respuestas_de(rondas_medico)];
  const representante = respuestas_principal[0];

  const tarjeta = buscar_condicion(principal.condicion_id)?.tarjeta ?? null;
  const total = votacion.rondas_por_modelo.valor;
  const motivos_escalar: string[] = [];
  if (ganador_medico === undefined) {
    motivos_escalar.push('Only the reasoning model answered: the medical model could not be reached or gave no valid answer.');
  } else if (ganador_razonamiento === undefined) {
    motivos_escalar.push('Only the medical model answered: the reasoning model could not be reached or gave no valid answer.');
  } else if (!de_acuerdo) {
    motivos_escalar.push('The two models did not choose the same condition.');
  }
  if (de_acuerdo && nivel === 'dudosa') motivos_escalar.push(`Low confidence: the model with fewer votes gave ${votos_minimos} of ${total}.`);
  if (principal.condicion_id === fuera_del_catalogo) motivos_escalar.push('The condition is not in the catalog: no validated protocol.');
  else if (!tarjeta) motivos_escalar.push('The condition is in the catalog but does not have a validated card yet.');
  else if (tarjeta.estado !== 'verificada') {
    motivos_escalar.push('The card is a general first-aid protocol, not NASA’s, and is not validated for microgravity: the flight surgeon must confirm it.');
  }

  return {
    nivel,
    de_acuerdo,
    escalar_tierra: motivos_escalar.length > 0,
    motivos_escalar,
    condicion: describir_opcion(principal),
    segunda_opcion: segunda ? describir_opcion(segunda) : null,
    urgencia: elegir_urgencia(respuestas_principal),
    sin_protocolo_validado: tarjeta === null || tarjeta.estado !== 'verificada',
    tarjeta,
    propuesta_ia: {
      etiqueta: 'AI proposal, not validated by a physician',
      acciones: representante?.acciones ?? [],
      que_no_hacer: representante?.que_no_hacer ?? [],
      razon: representante?.razon ?? '',
    },
    por_modelo: {
      razonamiento: resumir_modelo(rondas_razonamiento, opciones_razonamiento),
      medico: resumir_modelo(rondas_medico, opciones_medico),
    },
    umbrales: {
      rondas_por_modelo: total,
      votos_alta: votacion.votos_alta.valor,
      votos_media: votacion.votos_media.valor,
      fuente: votacion.votos_alta.fuente,
    },
  };
};

export type Resultado = NonNullable<ReturnType<typeof decidir>>;
