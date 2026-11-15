export type Cambio = { campo: string; delta: number; rampa: number };

export type Evento = { info: string; condicion: string; signos: Record<string, number | undefined>; sintomas?: string[] };

export type Tipo = 'control' | 'gradual' | 'repentino' | 'gradual_y_evento';

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
  condicion_prevencion_nombre: string | null;
  condicion_evento_nombre: string | null;
};

export type Catalogo = {
  plantillas: Plantilla[];
  campos: string[];
  signos_evento: string[];
  condiciones: { id: string; nombre: string }[];
};

export type LineaBase = {
  pulso_lpm: number;
  hrv_ms: number;
  presion_sistolica: number;
  presion_diastolica: number;
  temperatura_c: number;
  spo2: number;
  sueno_horas: number;
};

export type Astronauta = {
  id: string;
  nombre: string;
  callsign: string;
  rol: string;
  mision: string;
  dia_mision: number;
  duracion_dias: number | null;
  edad: number;
  sexo: 'hombre' | 'mujer';
  peso_kg: number;
  estatura_m: number;
  tipo_sangre: string | null;
  alergias: string[];
  antecedentes: string[];
  requerimientos: { kcal: number; proteina_g: number; liquidos_ml: number };
  linea_base_sugerida: LineaBase;
  escenario_id?: string | null;
};

export type Dia = {
  dia: number;
  fecha: string;
  cambiado: boolean;
  sueno_horas: number;
  sueno_calidad: number;
  animo: number;
  ejercicio: { equipo: string; minutos: number }[];
  sintomas: string[];
  kcal: number;
  proteina_g: number;
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

export type OpcionIA = { condicion_id: string; nombre: string; en_catalogo: boolean; votos_razonamiento: number; votos_medico: number };

export type Caso = {
  id: string;
  estado: string;
  progreso: { rondas_hechas: number; rondas_totales: number };
  error: string | null;
  resultado: null | {
    condicion: OpcionIA;
    segunda_opcion: OpcionIA | null;
    nivel: 'alta' | 'media' | 'dudosa';
    urgencia: number;
    escalar_tierra: boolean;
    motivos_escalar: string[];
    razon: string;
  };
  acierto: 'si' | 'segunda_opcion' | 'no' | null;
};

export type DiaHistorial = { dia: number; color: string; alertas: string[]; abiertos: ('preventivo' | 'seguimiento' | 'evento')[] };

export type Estado = {
  escenario: {
    id: string;
    crew_member_id: string;
    titulo: string;
    tipo: Tipo;
    descripcion: string;
    plantilla_base: string;
    personalizado: boolean;
    dias_totales: number;
    dia_inicio_cambios: number | null;
    dia_evento: number | null;
    fecha_base: string;
    fecha_inicio_cambios: string | null;
    fecha_evento: string | null;
    dia_actual: number;
    estado: 'activo' | 'terminado' | 'reemplazado';
  };
  astronauta: Astronauta | null;
  linea_base: LineaBase;
  verdad: {
    cambios: Cambio[];
    sintomas: Plantilla['sintomas'];
    evento: Evento | null;
    condicion_prevencion: { id: string; nombre: string } | null;
    condicion_evento: { id: string; nombre: string } | null;
  };
  dias: Dia[];
  historial: DiaHistorial[];
  deteccion: { primer_aviso_dia: number | null; avisos_antes_del_cambio: number; dias_tras_el_cambio: number | null; dias_de_anticipacion: number | null };
  vigilante: null | {
    color_general: string;
    semaforo: { parametro: string; color: string }[];
    alertas: { codigo: string; gravedad: string; mensaje: string }[];
  };
  preventivo: Caso | null;
  seguimiento: Caso | null;
  prevencion_final: Caso | null;
  evento: null | { emergencia_id: string; caso: Caso | null };
  prediccion: {
    radiacion: null | { proyectada_fin_mision_msv: number; limite_carrera_msv: number; supuesto: string; fuente: string };
    hueso: { meses: number; perdida_estimada_pct: { minimo: number; maximo: number }; supuesto: string; fuente: string };
  };
};

export const evento_bloqueo = 'panel-bloqueado';

export const pedir = async <T,>(ruta: string, opciones: { method?: string; body?: unknown } = {}): Promise<T> => {
  const respuesta = await fetch(`/v1/sim${ruta}`, {
    method: opciones.method ?? 'GET',
    headers: opciones.body ? { 'Content-Type': 'application/json' } : {},
    body: opciones.body ? JSON.stringify(opciones.body) : undefined,
  });
  const datos = (await respuesta.json().catch(() => ({}))) as Record<string, unknown>;
  if (respuesta.status === 401) {
    window.dispatchEvent(new Event(evento_bloqueo));
    throw new Error('Your session ended. Enter the password again.');
  }
  if (!respuesta.ok) {
    const detalle = typeof datos.message === 'string' ? datos.message : typeof datos.error === 'string' ? datos.error : `HTTP ${respuesta.status}`;
    throw new Error(detalle);
  }
  return datos as T;
};

export const nombres_campo: Record<string, { nombre: string; unidad: string; ayuda: string }> = {
  sueno_horas: { nombre: 'Sleep', unidad: 'h/night', ayuda: 'Hours slept' },
  sueno_calidad: { nombre: 'Sleep quality', unidad: '1–5 scale', ayuda: 'Self-reported quality' },
  animo: { nombre: 'Mood', unidad: '1–5 scale', ayuda: 'Self-reported mood' },
  kcal_factor: { nombre: 'Food intake', unidad: 'fraction', ayuda: '−0.5 = eats half of the usual' },
  liquidos_ml: { nombre: 'Fluids', unidad: 'ml/day', ayuda: 'Change in daily fluid intake' },
  ejercicio_factor: { nombre: 'Exercise', unidad: 'fraction', ayuda: '−1 = no exercise at all' },
  pulso_lpm: { nombre: 'Resting heart rate', unidad: 'bpm', ayuda: 'Morning resting reading' },
  hrv_ms: { nombre: 'Heart rate variability', unidad: 'ms', ayuda: 'SDNN' },
  presion_sistolica: { nombre: 'Systolic pressure', unidad: 'mmHg', ayuda: '' },
  presion_diastolica: { nombre: 'Diastolic pressure', unidad: 'mmHg', ayuda: '' },
  temperatura_c: { nombre: 'Temperature', unidad: '°C', ayuda: '' },
  spo2: { nombre: 'SpO₂', unidad: '%', ayuda: 'Blood oxygen saturation' },
  radiacion_msv: { nombre: 'Radiation dose', unidad: 'mSv/day', ayuda: 'Extra daily dose (e.g. solar storm)' },
};

export const nombres_tipo: Record<Tipo, string> = {
  control: 'Control',
  gradual: 'Gradual change',
  repentino: 'Sudden event',
  gradual_y_evento: 'Gradual change + event',
};
