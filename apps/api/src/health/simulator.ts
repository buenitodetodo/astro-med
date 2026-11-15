import { calcular_requerimientos, type Cuerpo } from './calculator';

export const campos = [
  'sueno_horas',
  'sueno_calidad',
  'animo',
  'kcal_factor',
  'liquidos_ml',
  'ejercicio_factor',
  'pulso_lpm',
  'hrv_ms',
  'presion_sistolica',
  'presion_diastolica',
  'temperatura_c',
  'spo2',
  'radiacion_msv',
] as const;

export type Campo = (typeof campos)[number];

type Cambio = { campo: Campo; delta: number; rampa: number };

export const signos_evento = ['pulso_lpm', 'presion_sistolica', 'presion_diastolica', 'spo2', 'temperatura_c'] as const;

type Signo = (typeof signos_evento)[number];

export type Tipo = 'control' | 'gradual' | 'repentino' | 'gradual_y_evento';

export type Evento = { info: string; condicion: string; signos: Partial<Record<Signo, number>>; sintomas?: string[] };

export type Plantilla = {
  id: string;
  titulo: string;
  tipo: Tipo;
  descripcion: string;
  dias_recomendados: number;
  inicio_cambios_recomendado: number | null;
  cambios: Cambio[];
  sintomas: { desde: number; lista: string[] } | null;
  condicion_prevencion: string | null;
  evento: Evento | null;
};

export const tipo_de = (plantilla: Pick<Plantilla, 'cambios' | 'sintomas' | 'evento'>): Tipo => {
  const gradual = plantilla.cambios.length > 0 || plantilla.sintomas !== null;
  if (gradual && plantilla.evento) return 'gradual_y_evento';
  if (gradual) return 'gradual';
  if (plantilla.evento) return 'repentino';
  return 'control';
};

export const plantillas: Plantilla[] = [
  {
    id: 'control_sano',
    titulo: 'Healthy control',
    tipo: 'control',
    descripcion: 'Normal routine all mission long. The system should stay green: any alert here is a false alarm.',
    dias_recomendados: 14,
    inicio_cambios_recomendado: null,
    cambios: [],
    sintomas: null,
    condicion_prevencion: null,
    evento: null,
  },
  {
    id: 'infeccion_respiratoria',
    titulo: 'Developing respiratory infection',
    tipo: 'gradual',
    descripcion: 'From the change day: temperature and heart rate climb, variability and SpO₂ drop, sleep and appetite worsen, then cough and sore throat.',
    dias_recomendados: 14,
    inicio_cambios_recomendado: 9,
    cambios: [
      { campo: 'temperatura_c', delta: 1.3, rampa: 4 },
      { campo: 'pulso_lpm', delta: 14, rampa: 4 },
      { campo: 'hrv_ms', delta: -20, rampa: 4 },
      { campo: 'spo2', delta: -3, rampa: 4 },
      { campo: 'sueno_horas', delta: -1, rampa: 3 },
      { campo: 'sueno_calidad', delta: -2, rampa: 3 },
      { campo: 'kcal_factor', delta: -0.25, rampa: 3 },
      { campo: 'ejercicio_factor', delta: -0.7, rampa: 2 },
      { campo: 'animo', delta: -2, rampa: 3 },
    ],
    sintomas: { desde: 1, lista: ['dry cough', 'sore throat', 'tiredness'] },
    condicion_prevencion: 'infeccion_respiratoria',
    evento: null,
  },
  {
    id: 'fatiga_y_desmayo',
    titulo: 'Sleep debt, fatigue and fainting',
    tipo: 'gradual_y_evento',
    descripcion: 'Sleep shrinks night after night, variability drops and heart rate rises. On the event day the person faints after exercising.',
    dias_recomendados: 14,
    inicio_cambios_recomendado: 8,
    cambios: [
      { campo: 'sueno_horas', delta: -2.5, rampa: 4 },
      { campo: 'sueno_calidad', delta: -2, rampa: 4 },
      { campo: 'hrv_ms', delta: -15, rampa: 4 },
      { campo: 'pulso_lpm', delta: 6, rampa: 4 },
      { campo: 'animo', delta: -2, rampa: 4 },
      { campo: 'ejercicio_factor', delta: -0.4, rampa: 4 },
    ],
    sintomas: { desde: 2, lista: ['tiredness', 'difficulty concentrating'] },
    condicion_prevencion: 'trastorno_sueno',
    evento: {
      info: 'Fainted for about 20 seconds at the end of an ARED session. Woke up without help a few seconds later, pale and sweaty; no injury.',
      condicion: 'sincope',
      signos: { pulso_lpm: -6, presion_sistolica: -16, presion_diastolica: -10 },
      sintomas: ['brief loss of consciousness', 'lightheadedness before fainting'],
    },
  },
  {
    id: 'deshidratacion_rinon',
    titulo: 'Low fluid intake and kidney stone risk',
    tipo: 'gradual',
    descripcion: 'Fluid intake drops well below the requirement and heart rate rises slightly; later dark urine and flank discomfort appear.',
    dias_recomendados: 14,
    inicio_cambios_recomendado: 8,
    cambios: [
      { campo: 'liquidos_ml', delta: -1400, rampa: 3 },
      { campo: 'pulso_lpm', delta: 5, rampa: 4 },
      { campo: 'animo', delta: -1, rampa: 4 },
    ],
    sintomas: { desde: 3, lista: ['dark urine', 'mild flank discomfort'] },
    condicion_prevencion: 'piedras_rinon',
    evento: null,
  },
  {
    id: 'gastroenteritis',
    titulo: 'Gastroenteritis',
    tipo: 'gradual',
    descripcion: 'Appetite and fluids collapse within two days, with mild fever, faster heart rate, nausea and diarrhea.',
    dias_recomendados: 12,
    inicio_cambios_recomendado: 9,
    cambios: [
      { campo: 'kcal_factor', delta: -0.55, rampa: 2 },
      { campo: 'liquidos_ml', delta: -900, rampa: 2 },
      { campo: 'temperatura_c', delta: 0.7, rampa: 2 },
      { campo: 'pulso_lpm', delta: 8, rampa: 2 },
      { campo: 'ejercicio_factor', delta: -0.8, rampa: 1 },
    ],
    sintomas: { desde: 0, lista: ['nausea', 'diarrhea', 'abdominal cramps'] },
    condicion_prevencion: 'gastroenteritis',
    evento: null,
  },
  {
    id: 'laceracion',
    titulo: 'Sudden cut with a tool',
    tipo: 'repentino',
    descripcion: 'Normal routine, then an external accident on the event day: it cannot be predicted from the data, so the crew report starts the process.',
    dias_recomendados: 10,
    inicio_cambios_recomendado: null,
    cambios: [],
    sintomas: null,
    condicion_prevencion: null,
    evento: {
      info: 'Cut the left palm with a screwdriver while repairing a panel: a 4 cm wound through the skin, bleeding controlled with pressure.',
      condicion: 'laceracion_piel',
      signos: { pulso_lpm: 22, presion_sistolica: 14, presion_diastolica: 8 },
      sintomas: ['bleeding cut on the left palm', 'pain at the wound'],
    },
  },
];

export const buscar_plantilla = (id: string) => plantillas.find((plantilla) => plantilla.id === id);

const ruido = (semilla: number) => {
  const x = Math.sin(semilla * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
};

const semilla_de = (texto: string) => [...texto].reduce((suma, letra) => (suma * 31 + letra.charCodeAt(0)) % 100_000, 7);

const limitar = (valor: number, minimo: number, maximo: number) => Math.min(maximo, Math.max(minimo, valor));

const redondear_a = (valor: number, paso: number) => Math.round(valor / paso) * paso;

export type LineaBase = {
  pulso_lpm: number;
  hrv_ms: number;
  presion_sistolica: number;
  presion_diastolica: number;
  temperatura_c: number;
  spo2: number;
  sueno_horas: number;
};

export const calcular_linea_base = (crew_id: string): LineaBase => {
  const semilla = semilla_de(crew_id);
  const n = (indice: number) => (ruido(semilla + indice * 7919) + 1) / 2;
  return {
    pulso_lpm: Math.round(56 + n(1) * 10),
    hrv_ms: Math.round(45 + n(2) * 25),
    presion_sistolica: Math.round(106 + n(3) * 14),
    presion_diastolica: Math.round(68 + n(4) * 8),
    temperatura_c: Math.round((36.4 + n(5) * 0.4) * 10) / 10,
    spo2: n(6) > 0.4 ? 98 : 97,
    sueno_horas: redondear_a(7 + n(7) * 0.75, 0.25),
  };
};

export type DiaSimulado = {
  dia: number;
  fecha: string;
  cambiado: boolean;
  sueno_horas: number;
  sueno_calidad: number;
  animo: number;
  ejercicio: { equipo: 'ARED' | 'T2' | 'CEVIS'; minutos: number }[];
  sintomas: string[];
  kcal: number;
  proteina_g: number;
  carbohidratos_g: number;
  grasas_g: number;
  liquidos_ml: number;
  pulso_lpm: number;
  hrv_ms: number;
  presion_sistolica: number;
  presion_diastolica: number;
  temperatura_c: number;
  spo2: number;
  radiacion_msv: number;
  evento: null | {
    info: string;
    sintomas: string[];
    pulso_lpm: number;
    presion_sistolica: number;
    presion_diastolica: number;
    temperatura_c: number;
    spo2: number;
  };
};

export type ConfigEscenario = {
  id: string;
  plantilla: Plantilla;
  linea_base: LineaBase;
  dia_inicio_cambios: number | null;
  dia_evento: number | null;
  fecha_base: string;
};

export const fecha_del_dia = (fecha_base: string, dia: number) =>
  new Date(Date.parse(`${fecha_base}T00:00:00Z`) + (dia - 1) * 86_400_000).toISOString().slice(0, 10);

const una_decima = (valor: number) => Math.round(valor * 10) / 10;

export const generar_dia = (escenario: ConfigEscenario, cuerpo: Cuerpo, con_equipo: boolean, dia: number): DiaSimulado => {
  const semilla = semilla_de(escenario.id) + dia * 17;
  const r = (indice: number) => ruido(semilla + indice * 101);
  const requerimientos = calcular_requerimientos(cuerpo, con_equipo);
  const base_personal = escenario.linea_base;
  const inicio = escenario.dia_inicio_cambios;
  const efecto = (campo: Campo) =>
    escenario.plantilla.cambios
      .filter((cambio) => cambio.campo === campo && inicio !== null && dia >= inicio)
      .reduce((suma, cambio) => suma + cambio.delta * Math.min(1, (dia - inicio! + 1) / cambio.rampa), 0);

  const factor_kcal = Math.max(0, 1 + efecto('kcal_factor'));
  const factor_ejercicio = Math.max(0, 1 + efecto('ejercicio_factor'));
  const kcal = Math.round((requerimientos.energia_kcal * 1.04 + r(1) * 40) * factor_kcal);
  const minutos_ared = Math.round((50 + r(2) * 5) * factor_ejercicio);
  const minutos_aerobico = Math.round((35 + r(3) * 5) * factor_ejercicio);
  const ejercicio = [
    ...(minutos_ared >= 5 ? [{ equipo: 'ARED' as const, minutos: minutos_ared }] : []),
    ...(minutos_aerobico >= 5 ? [{ equipo: (dia % 2 === 0 ? 'T2' : 'CEVIS') as 'T2' | 'CEVIS', minutos: minutos_aerobico }] : []),
  ];
  const sintomas =
    escenario.plantilla.sintomas && inicio !== null && dia >= inicio + escenario.plantilla.sintomas.desde ? escenario.plantilla.sintomas.lista : [];

  const signos = {
    pulso_lpm: limitar(Math.round(base_personal.pulso_lpm + r(4) * 3 + efecto('pulso_lpm')), 30, 200),
    hrv_ms: limitar(Math.round(base_personal.hrv_ms + r(5) * 5 + efecto('hrv_ms')), 5, 200),
    presion_sistolica: limitar(Math.round(base_personal.presion_sistolica + r(6) * 4 + efecto('presion_sistolica')), 60, 240),
    presion_diastolica: limitar(Math.round(base_personal.presion_diastolica + r(7) * 3 + efecto('presion_diastolica')), 30, 150),
    temperatura_c: limitar(una_decima(base_personal.temperatura_c + r(8) * 0.15 + efecto('temperatura_c')), 33, 42),
    spo2: limitar(Math.round(base_personal.spo2 + r(9) * 0.6 + efecto('spo2')), 70, 100),
  };

  const evento = escenario.dia_evento === dia ? escenario.plantilla.evento : null;
  const cambio_evento = evento?.signos ?? {};

  return {
    dia,
    fecha: fecha_del_dia(escenario.fecha_base, dia),
    cambiado: inicio !== null && dia >= inicio,
    sueno_horas: limitar(redondear_a(base_personal.sueno_horas + r(10) * 0.3 + efecto('sueno_horas'), 0.25), 0, 12),
    sueno_calidad: limitar(Math.round(4 + efecto('sueno_calidad')), 1, 5),
    animo: limitar(Math.round(4 + efecto('animo')), 1, 5),
    ejercicio,
    sintomas,
    kcal,
    proteina_g: Math.round(requerimientos.proteina_g.minimo * 1.25 * factor_kcal),
    carbohidratos_g: Math.round((kcal * 0.55) / 4),
    grasas_g: Math.round((kcal * 0.27) / 9),
    liquidos_ml: Math.max(0, Math.round(requerimientos.liquidos_ml + 350 + r(11) * 80 + efecto('liquidos_ml'))),
    ...signos,
    radiacion_msv: Math.max(0, Math.round((0.4 + r(12) * 0.03 + efecto('radiacion_msv')) * 100) / 100),
    evento: evento
      ? {
          info: evento.info,
          sintomas: evento.sintomas ?? [],
          pulso_lpm: limitar(signos.pulso_lpm + (cambio_evento.pulso_lpm ?? 0), 30, 220),
          presion_sistolica: limitar(signos.presion_sistolica + (cambio_evento.presion_sistolica ?? 0), 50, 250),
          presion_diastolica: limitar(signos.presion_diastolica + (cambio_evento.presion_diastolica ?? 0), 25, 160),
          temperatura_c: limitar(una_decima(signos.temperatura_c + (cambio_evento.temperatura_c ?? 0)), 33, 42),
          spo2: limitar(signos.spo2 + (cambio_evento.spo2 ?? 0), 60, 100),
        }
      : null,
  };
};

const fuente_hueso = 'NASA OCHMO-TB-030: 1–2% per month in spine and hip';

export const proyectar = (datos: {
  dia_mision: number;
  duracion_dias: number | null;
  dosis_acumulada_msv: number;
  dosis_media_diaria_msv: number;
  limite_carrera_msv: number;
}) => {
  const restantes = datos.duracion_dias ? Math.max(0, datos.duracion_dias - datos.dia_mision) : null;
  const meses_caracterizados = Math.min(6, datos.dia_mision / 30.4);
  return {
    radiacion: restantes === null
      ? null
      : {
          proyectada_fin_mision_msv: Math.round((datos.dosis_acumulada_msv + datos.dosis_media_diaria_msv * restantes) * 10) / 10,
          limite_carrera_msv: datos.limite_carrera_msv,
          supuesto: 'Recorded doses only, at the current daily rate, for the remaining mission days.',
          fuente: 'NASA OCHMO Standards Overview (career limit 600 mSv)',
        },
    hueso: {
      meses: Math.round(meses_caracterizados * 10) / 10,
      perdida_estimada_pct: { minimo: Math.round(meses_caracterizados * 1 * 10) / 10, maximo: Math.round(meses_caracterizados * 2 * 10) / 10 },
      supuesto:
        'Spine and hip loss so far at the published monthly rate, capped at 6 months because the curve is not characterized beyond that (NTRS 20170004597). Exercise can reduce it. Risk estimate, not a measurement.',
      fuente: fuente_hueso,
    },
  };
};
