import type { LecturaConFuente } from './data';
import type { Resultado } from './doctor';
import type { Alerta, Color } from './watcher';

export const fuente_retraso = 'Earth–Mars one-way delay of about 3 to 22 min (NASA NTRS 20220013418)';

export type ContenidoReporte = {
  generado_en: string;
  astronauta: {
    nombre: string;
    rol: string;
    edad: number;
    sexo: string;
    peso_kg: number;
    tipo_sangre: string | null;
    alergias: string[];
    antecedentes: string[];
  };
  mision: { nombre: string; fase: string; dia: number };
  emergencia: {
    id: string;
    origen: string;
    reportada_por: string | null;
    descripcion: string | null;
    creada_en: string;
    estado: string;
  } | null;
  doctor: {
    caso_id: string;
    estado: string;
    error: string | null;
    resultado: Resultado | null;
  } | null;
  vigilante: { color_general: Color; alertas: Pick<Alerta, 'gravedad' | 'mensaje' | 'fuente'>[] };
  signos_recientes: LecturaConFuente[];
  notas: string | null;
};

const nombres_color: Record<Color, string> = {
  verde: 'green',
  amarillo: 'yellow',
  rojo: 'red',
  informativo: 'informational',
  sin_datos: 'no data',
};

const nombres_nivel = { alta: 'high', media: 'medium', dudosa: 'doubtful' } as const;

const describir_signo = (signo: LecturaConFuente) =>
  [
    signo.pulso_lpm !== null ? `HR ${signo.pulso_lpm} bpm` : null,
    signo.hrv_ms !== null ? `HRV ${signo.hrv_ms} ms` : null,
    signo.presion_sistolica !== null ? `BP ${signo.presion_sistolica}/${signo.presion_diastolica} mmHg` : null,
    signo.temperatura_c !== null ? `T ${signo.temperatura_c} °C` : null,
    signo.spo2 !== null ? `SpO₂ ${signo.spo2}%` : null,
  ]
    .filter((parte) => parte !== null)
    .join(', ');

export const armar_titulo = (contenido: ContenidoReporte) => {
  const resultado = contenido.doctor?.resultado;
  if (resultado) return `Medical report: ${resultado.condicion.nombre} (${nombres_nivel[resultado.nivel]} confidence)`;
  if (contenido.emergencia) return `Emergency report: ${contenido.emergencia.descripcion?.slice(0, 80) ?? 'no description'}`;
  return `Health report: watcher status ${nombres_color[contenido.vigilante.color_general]}`;
};

export const armar_texto = (contenido: ContenidoReporte) => {
  const { astronauta, mision, emergencia, doctor, vigilante } = contenido;
  const resultado = doctor?.resultado ?? null;
  const lineas = [
    `ASTRO-MED REPORT · ${mision.nombre} · ${mision.fase} · mission day ${mision.dia}`,
    `Generated ${contenido.generado_en.slice(0, 16).replace('T', ' ')} UTC`,
    '',
    `Astronaut: ${astronauta.nombre}, ${astronauta.rol}, ${astronauta.edad} y, ${astronauta.sexo === 'hombre' ? 'male' : 'female'}, ${astronauta.peso_kg} kg, blood type ${astronauta.tipo_sangre ?? 'not recorded'}.`,
    `Allergies: ${astronauta.alergias.join(', ') || 'none recorded'}. History: ${astronauta.antecedentes.join(', ') || 'none recorded'}.`,
  ];
  if (emergencia) {
    lineas.push(
      '',
      `EMERGENCY (${emergencia.estado}) opened ${emergencia.creada_en.slice(0, 16).replace('T', ' ')} UTC by ${emergencia.reportada_por ?? emergencia.origen}.`,
      `Description: ${emergencia.descripcion ?? 'none'}`,
    );
  }
  if (doctor && resultado) {
    lineas.push(
      '',
      `AI DOCTOR VOTE: ${resultado.condicion.nombre} · confidence ${nombres_nivel[resultado.nivel]} · urgency ${resultado.urgencia}/3.`,
      `Votes: reasoning model ${resultado.condicion.votos_razonamiento}/${resultado.umbrales.rondas_por_modelo}, medical model ${resultado.condicion.votos_medico}/${resultado.umbrales.rondas_por_modelo}.`,
      ...(resultado.segunda_opcion ? [`Second option: ${resultado.segunda_opcion.nombre}.`] : []),
      `Card applied: ${resultado.tarjeta?.titulo ?? 'none (no card for this condition)'}.`,
      `AI proposed actions (not validated): ${resultado.propuesta_ia.acciones.join(' | ') || 'none'}.`,
      ...(resultado.escalar_tierra ? [`Escalated to Earth: ${resultado.motivos_escalar.join(' ')}`] : []),
    );
  } else if (doctor) {
    lineas.push('', `AI DOCTOR: ${doctor.estado}${doctor.error ? ` (${doctor.error})` : ''}.`);
  }
  lineas.push(
    '',
    `WATCHER: overall ${nombres_color[vigilante.color_general]}.`,
    ...(vigilante.alertas.length > 0 ? vigilante.alertas.map((alerta) => `- [${alerta.gravedad === 'rojo' ? 'red' : 'yellow'}] ${alerta.mensaje}`) : ['- no alerts']),
    '',
    'RECENT VITALS:',
    ...(contenido.signos_recientes.length > 0
      ? contenido.signos_recientes.map((signo) => `- ${signo.registrado_en.slice(0, 16).replace('T', ' ')} UTC (${signo.fuente}): ${describir_signo(signo)}`)
      : ['- no readings']),
  );
  if (contenido.notas) lineas.push('', `CREW NOTES: ${contenido.notas}`);
  return lineas.join('\n');
};

export type Transmision = {
  estado: 'en_camino' | 'recibido' | 'respondido';
  retraso_minutos: number;
  aceleracion: number;
  fuente_retraso: string;
  enviado_en: string;
  llega_en: string;
  respuesta_en: string;
  segundos_para_llegar: number;
  segundos_para_respuesta: number;
  respuesta: string | null;
};

export const calcular_transmision = (
  fila: { aprobado_en: string; llega_en: string; respuesta_en: string; retraso_minutos: number; aceleracion: number },
  contenido: ContenidoReporte,
  ahora = Date.now(),
): Transmision => {
  const llega = Date.parse(fila.llega_en);
  const respuesta = Date.parse(fila.respuesta_en);
  const estado = ahora >= respuesta ? 'respondido' : ahora >= llega ? 'recibido' : 'en_camino';
  return {
    estado,
    retraso_minutos: fila.retraso_minutos,
    aceleracion: fila.aceleracion,
    fuente_retraso,
    enviado_en: fila.aprobado_en,
    llega_en: fila.llega_en,
    respuesta_en: fila.respuesta_en,
    segundos_para_llegar: Math.max(0, Math.ceil((llega - ahora) / 1000)),
    segundos_para_respuesta: Math.max(0, Math.ceil((respuesta - ahora) / 1000)),
    respuesta: estado === 'respondido' ? respuesta_simulada(contenido, fila.llega_en) : null,
  };
};

export const respuesta_simulada = (contenido: ContenidoReporte, recibido_en: string) => {
  const resultado = contenido.doctor?.resultado ?? null;
  const asunto = resultado ? `${resultado.condicion.nombre}, urgency ${resultado.urgencia}/3` : contenido.emergencia ? 'the reported emergency' : 'the health report';
  return [
    'SIMULATED RESPONSE for the demo, not an actual NASA protocol.',
    `Mission Control flight surgeon received the report for ${contenido.astronauta.nombre} at ${recibido_en.slice(0, 16).replace('T', ' ')} UTC about ${asunto}.`,
    'Continue the on-board plan and keep monitoring the vital signs; a physician will review the case at the next communication window.',
  ].join(' ');
};
