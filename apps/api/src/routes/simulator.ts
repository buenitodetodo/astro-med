import { Hono } from 'hono';
import { z } from 'zod';
import { deleteCrewData } from '../store';
import type { AppEnv, Crew } from '../types';
import { validate } from '../validate';
import { calcular_requerimientos } from '../health/calculator';
import { buscar_condicion, catalogo } from '../health/content';
import { cargar_perfil, con_equipo_ejercicio, fecha_hace, vigilar_tripulante, type FilaPerfil } from '../health/data';
import type { Resultado } from '../health/doctor';
import {
  buscar_plantilla, calcular_linea_base, campos, fecha_del_dia, generar_dia, plantillas, proyectar, signos_evento, tipo_de,
  type ConfigEscenario, type DiaSimulado, type LineaBase, type Plantilla,
} from '../health/simulator';
import { umbrales } from '../health/thresholds';
import { crear_caso } from './doctor';
import { crear_emergencia } from './emergency';

type FilaEscenario = {
  id: string;
  crew_member_id: string;
  plantilla: string;
  configuracion: string;
  dias_totales: number;
  dia_inicio_cambios: number | null;
  dia_evento: number | null;
  fecha_base: string;
  dia_actual: number;
  estado: 'activo' | 'terminado' | 'reemplazado';
  primer_aviso_dia: number | null;
  avisos_antes_del_cambio: number;
  caso_preventivo_id: string | null;
  caso_seguimiento_id: string | null;
  emergencia_id: string | null;
  caso_evento_id: string | null;
  historial: string;
  creado_en: string;
};

type DiaHistorial = { dia: number; color: string; alertas: string[]; abiertos: ('preventivo' | 'seguimiento' | 'evento')[] };

type Configuracion = { plantilla: Plantilla; linea_base: LineaBase; personalizado: boolean };

type FilaCasoSim = { id: string; estado: string; rondas_hechas: number; rondas_totales: number; resultado: string | null; error: string | null };

const descripcion_preventiva =
  'Preventive check requested automatically by the watcher after new alerts. The crew member has not reported an emergency.';

const descripcion_seguimiento =
  'Follow-up check requested automatically: new symptoms were logged after the previous preventive check. The crew member has not reported an emergency.';

const texto_corto = z.string().trim().min(1).max(80);

const escenario_schema = z.object({
  crew_id: z.string().min(1).max(64),
  plantilla: z.string().min(1).max(64),
  titulo: z.string().trim().min(1).max(120).optional(),
  dias_totales: z.number().int().min(7).max(30).optional(),
  dia_inicio_cambios: z.number().int().min(6).max(30).optional(),
  dia_evento: z.number().int().min(2).max(30).optional(),
  cambios: z
    .array(z.object({ campo: z.enum(campos), delta: z.number().min(-5000).max(5000), rampa: z.number().int().min(1).max(30) }))
    .max(20)
    .optional(),
  sintomas: z.object({ desde: z.number().int().min(0).max(30), lista: z.array(texto_corto).min(1).max(10) }).nullable().optional(),
  condicion_prevencion: z.string().max(64).nullable().optional(),
  evento: z
    .object({
      info: z.string().trim().min(1).max(1000),
      condicion: z.string().min(1).max(64),
      signos: z.object(Object.fromEntries(signos_evento.map((signo) => [signo, z.number().min(-100).max(100).optional()]))),
      sintomas: z.array(texto_corto).max(10).optional(),
    })
    .nullable()
    .optional(),
  linea_base: z
    .object({
      pulso_lpm: z.number().min(35).max(110),
      hrv_ms: z.number().min(10).max(150),
      presion_sistolica: z.number().min(80).max(160),
      presion_diastolica: z.number().min(45).max(100),
      temperatura_c: z.number().min(35.5).max(37.5),
      spo2: z.number().min(90).max(100),
      sueno_horas: z.number().min(4).max(10),
    })
    .partial()
    .optional(),
});

const avanzar_schema = z.object({ dias: z.number().int().min(1).max(30).default(1) });

const cargar_crew = (db: D1Database, id: string) =>
  db
    .prepare(
      `SELECT c.id, c.callsign, c.role, m.id AS missionId, m.name AS missionName, m.phase, m.started_at AS missionStart, m.duration_days AS durationDays
       FROM crew_members c JOIN missions m ON m.id = c.mission_id WHERE c.id = ? AND c.is_demo = 1`,
    )
    .bind(id)
    .first<Crew>();

const buscar_escenario = (db: D1Database, id: string) => db.prepare('SELECT * FROM escenarios_sim WHERE id = ?').bind(id).first<FilaEscenario>();

const leer_configuracion = (fila: FilaEscenario) => JSON.parse(fila.configuracion) as Configuracion;

const config_de = (fila: FilaEscenario): ConfigEscenario => {
  const { plantilla, linea_base } = leer_configuracion(fila);
  return { id: fila.id, plantilla, linea_base, dia_inicio_cambios: fila.dia_inicio_cambios, dia_evento: fila.dia_evento, fecha_base: fila.fecha_base };
};

const dia_de_mision = (crew: Crew) => Math.floor((Date.now() - Date.parse(crew.missionStart.replace(' ', 'T') + 'Z')) / 86_400_000) + 1;

const condicion = (id: string | null) => (id ? { id, nombre: buscar_condicion(id)?.nombre ?? id } : null);

const describir_astronauta = (perfil: FilaPerfil, crew: Crew, env: Env) => {
  const requerimientos = calcular_requerimientos(perfil, con_equipo_ejercicio(env));
  return {
    id: crew.id,
    nombre: perfil.nombre,
    callsign: crew.callsign,
    rol: crew.role,
    mision: crew.missionName,
    dia_mision: dia_de_mision(crew),
    duracion_dias: crew.durationDays,
    edad: perfil.edad,
    sexo: perfil.sexo,
    peso_kg: perfil.peso_kg,
    estatura_m: perfil.estatura_m,
    tipo_sangre: perfil.tipo_sangre,
    alergias: JSON.parse(perfil.alergias) as string[],
    antecedentes: JSON.parse(perfil.antecedentes) as string[],
    requerimientos: {
      kcal: Math.round(requerimientos.energia_kcal),
      proteina_g: Math.round(requerimientos.proteina_g.minimo),
      liquidos_ml: Math.round(requerimientos.liquidos_ml),
    },
    linea_base_sugerida: calcular_linea_base(crew.id),
  };
};

const en_el_pasado = (fecha: string, hora: string) =>
  new Date(Math.min(Date.parse(`${fecha}T${hora}:00Z`), Date.now() - 60_000)).toISOString();

const escribir_dia = async (db: D1Database, crew_id: string, escenario_id: string, dia: DiaSimulado) => {
  const ahora = new Date().toISOString();
  const prefijo = `sim-${escenario_id}-${dia.dia}`;
  const observacion = (sufijo: string, metrica: string, valor: number, unidad: string, momento: string) =>
    db
      .prepare(
        `INSERT OR REPLACE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
         VALUES (?, ?, ?, NULL, ?, ?, ?, 'simulated', 'ok', ?, ?)`,
      )
      .bind(`${prefijo}-${sufijo}`, `${prefijo}-${sufijo}`, crew_id, metrica, valor, unidad, momento, ahora);
  const manana = en_el_pasado(dia.fecha, '08:00');
  const comidas = [
    { n: 1, hora: '07:30', parte: 0.3, nombre: 'Breakfast rations' },
    { n: 2, hora: '12:30', parte: 0.4, nombre: 'Lunch rations' },
    { n: 3, hora: '18:30', parte: 0.3, nombre: 'Dinner rations' },
  ];
  const sintomas = [...new Set([...dia.sintomas, ...(dia.evento?.sintomas ?? [])])];
  const sentencias = [
    db
      .prepare(
        `INSERT INTO bitacora (crew_member_id, fecha, sueno_horas, sueno_calidad, ejercicio, caminata_espacial_horas, animo, sintomas, actualizado_en)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)
         ON CONFLICT (crew_member_id, fecha) DO UPDATE SET sueno_horas = excluded.sueno_horas, sueno_calidad = excluded.sueno_calidad,
           ejercicio = excluded.ejercicio, animo = excluded.animo, sintomas = excluded.sintomas, actualizado_en = excluded.actualizado_en`,
      )
      .bind(crew_id, dia.fecha, dia.sueno_horas, dia.sueno_calidad, JSON.stringify(dia.ejercicio), dia.animo, JSON.stringify(sintomas), ahora),
    ...comidas.map((comida) =>
      db
        .prepare(
          `INSERT OR REPLACE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
           VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          `${prefijo}-comida-${comida.n}`, crew_id, dia.fecha, en_el_pasado(dia.fecha, comida.hora), comida.nombre,
          Math.round(dia.kcal * comida.parte), Math.round(dia.proteina_g * comida.parte), Math.round(dia.carbohidratos_g * comida.parte),
          Math.round(dia.grasas_g * comida.parte), Math.round(dia.liquidos_ml * comida.parte), ahora,
        ),
    ),
    observacion('hr', 'heart_rate', dia.pulso_lpm, 'bpm', manana),
    observacion('hrv', 'hrv_sdnn', dia.hrv_ms, 'ms', manana),
    observacion('sys', 'bp_systolic', dia.presion_sistolica, 'mmHg', manana),
    observacion('dia', 'bp_diastolic', dia.presion_diastolica, 'mmHg', manana),
    observacion('temp', 'body_temperature', dia.temperatura_c, '°C', manana),
    observacion('spo2', 'spo2', dia.spo2, '%', manana),
    observacion('rad', 'radiation_dose', dia.radiacion_msv, 'mSv', en_el_pasado(dia.fecha, '06:00')),
  ];
  if (dia.evento) {
    const momento = en_el_pasado(dia.fecha, '14:00');
    sentencias.push(
      observacion('ev-hr', 'heart_rate', dia.evento.pulso_lpm, 'bpm', momento),
      observacion('ev-sys', 'bp_systolic', dia.evento.presion_sistolica, 'mmHg', momento),
      observacion('ev-dia', 'bp_diastolic', dia.evento.presion_diastolica, 'mmHg', momento),
      observacion('ev-temp', 'body_temperature', dia.evento.temperatura_c, '°C', momento),
      observacion('ev-spo2', 'spo2', dia.evento.spo2, '%', momento),
    );
  }
  await db.batch(sentencias);
};

const mover_datos = async (db: D1Database, crew_id: string, dias: number) => {
  const modificador = `${dias} days`;
  const instantes = (tabla: string, columnas: string[]) =>
    db
      .prepare(`UPDATE ${tabla} SET ${columnas.map((col) => `${col} = strftime('%Y-%m-%dT%H:%M:%fZ', ${col}, ?1)`).join(', ')} WHERE crew_member_id = ?2`)
      .bind(modificador, crew_id);
  await db.batch([
    instantes('health_observations', ['observed_at', 'received_at']),
    instantes('health_alerts', ['created_at']),
    instantes('sync_events', ['created_at']),
    instantes('comidas', ['comido_en', 'creado_en']),
    db.prepare('UPDATE comidas SET fecha = date(fecha, ?1) WHERE crew_member_id = ?2').bind(modificador, crew_id),
    instantes('emergencias', ['creada_en', 'vence_en', 'cancelada_en']),
    instantes('casos_doctor', ['creado_en', 'terminado_en']),
    instantes('reportes', ['creado_en', 'aprobado_en', 'llega_en', 'respuesta_en']),
    db
      .prepare(`UPDATE bitacora SET fecha = '~' || date(fecha, ?1), actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ', actualizado_en, ?1) WHERE crew_member_id = ?2`)
      .bind(modificador, crew_id),
    db.prepare(`UPDATE bitacora SET fecha = substr(fecha, 2) WHERE crew_member_id = ?1 AND fecha LIKE '~%'`).bind(crew_id),
  ]);
};

const anclar_a_hoy = async (db: D1Database, fila: FilaEscenario, dias: number) => {
  const dia_final = Math.min(fila.dia_actual + dias, fila.dias_totales);
  const nueva_base = fecha_hace(dia_final - 1);
  const diferencia = Math.round((Date.parse(nueva_base) - Date.parse(fila.fecha_base)) / 86_400_000);
  if (diferencia === 0) return fila;
  if (fila.dia_actual > 0) await mover_datos(db, fila.crew_member_id, diferencia);
  await db.prepare('UPDATE escenarios_sim SET fecha_base = ? WHERE id = ?').bind(nueva_base, fila.id).run();
  return { ...fila, fecha_base: nueva_base };
};

const resumir_caso = async (db: D1Database, id: string | null, esperada: string | null) => {
  if (!id) return null;
  const fila = await db.prepare('SELECT id, estado, rondas_hechas, rondas_totales, resultado, error FROM casos_doctor WHERE id = ?').bind(id).first<FilaCasoSim>();
  if (!fila) return null;
  const resultado = fila.resultado ? (JSON.parse(fila.resultado) as Resultado) : null;
  const acierto = !resultado || !esperada
    ? null
    : resultado.condicion.condicion_id === esperada
      ? 'si'
      : resultado.segunda_opcion?.condicion_id === esperada
        ? 'segunda_opcion'
        : 'no';
  return {
    id: fila.id,
    estado: fila.estado,
    progreso: { rondas_hechas: fila.rondas_hechas, rondas_totales: fila.rondas_totales },
    error: fila.error,
    resultado: resultado
      ? {
          condicion: resultado.condicion,
          segunda_opcion: resultado.segunda_opcion,
          nivel: resultado.nivel,
          urgencia: resultado.urgencia,
          escalar_tierra: resultado.escalar_tierra,
          motivos_escalar: resultado.motivos_escalar,
          razon: resultado.propuesta_ia.razon,
        }
      : null,
    acierto,
  };
};

const armar_estado = async (env: Env, fila: FilaEscenario) => {
  const db = env.DB;
  const { plantilla, linea_base, personalizado } = leer_configuracion(fila);
  const [perfil, crew] = await Promise.all([cargar_perfil(db, fila.crew_member_id), cargar_crew(db, fila.crew_member_id)]);
  const config = config_de(fila);
  const equipo = con_equipo_ejercicio(env);
  const dias = perfil ? Array.from({ length: fila.dia_actual }, (_, indice) => generar_dia(config, perfil, equipo, indice + 1)) : [];
  const vigilante =
    perfil && fila.dia_actual > 0 && fila.estado !== 'reemplazado'
      ? await vigilar_tripulante(db, env, perfil, fecha_del_dia(fila.fecha_base, fila.dia_actual + 1))
      : null;
  const [preventivo, seguimiento, evento] = await Promise.all([
    resumir_caso(db, fila.caso_preventivo_id, plantilla.condicion_prevencion),
    resumir_caso(db, fila.caso_seguimiento_id, plantilla.condicion_prevencion),
    resumir_caso(db, fila.caso_evento_id, plantilla.evento?.condicion ?? null),
  ]);
  const dosis = dias.reduce((suma, dia) => suma + dia.radiacion_msv, 0);

  return {
    escenario: {
      id: fila.id,
      crew_member_id: fila.crew_member_id,
      titulo: plantilla.titulo,
      tipo: plantilla.tipo,
      descripcion: plantilla.descripcion,
      plantilla_base: fila.plantilla,
      personalizado,
      dias_totales: fila.dias_totales,
      dia_inicio_cambios: fila.dia_inicio_cambios,
      dia_evento: fila.dia_evento,
      fecha_base: fila.fecha_base,
      fecha_inicio_cambios: fila.dia_inicio_cambios ? fecha_del_dia(fila.fecha_base, fila.dia_inicio_cambios) : null,
      fecha_evento: fila.dia_evento ? fecha_del_dia(fila.fecha_base, fila.dia_evento) : null,
      dia_actual: fila.dia_actual,
      estado: fila.estado,
    },
    astronauta: perfil && crew ? describir_astronauta(perfil, crew, env) : null,
    linea_base,
    verdad: {
      cambios: plantilla.cambios,
      sintomas: plantilla.sintomas,
      evento: plantilla.evento,
      condicion_prevencion: condicion(plantilla.condicion_prevencion),
      condicion_evento: condicion(plantilla.evento?.condicion ?? null),
    },
    dias,
    historial: JSON.parse(fila.historial) as DiaHistorial[],
    deteccion: {
      primer_aviso_dia: fila.primer_aviso_dia,
      avisos_antes_del_cambio: fila.avisos_antes_del_cambio,
      dias_tras_el_cambio:
        fila.primer_aviso_dia !== null && fila.dia_inicio_cambios !== null ? fila.primer_aviso_dia - fila.dia_inicio_cambios : null,
      dias_de_anticipacion: fila.primer_aviso_dia !== null && fila.dia_evento !== null ? fila.dia_evento - fila.primer_aviso_dia : null,
    },
    vigilante: vigilante
      ? {
          color_general: vigilante.color_general,
          semaforo: vigilante.evaluaciones.map(({ parametro, color }) => ({ parametro, color })),
          alertas: vigilante.alertas.map(({ codigo, gravedad, mensaje }) => ({ codigo, gravedad, mensaje })),
        }
      : null,
    preventivo,
    seguimiento,
    prevencion_final: seguimiento ?? preventivo,
    evento: fila.emergencia_id ? { emergencia_id: fila.emergencia_id, caso: evento } : null,
    prediccion: proyectar({
      dia_mision: crew ? dia_de_mision(crew) : 1,
      duracion_dias: crew?.durationDays ?? null,
      dosis_acumulada_msv: dosis,
      dosis_media_diaria_msv: dias.length ? dosis / dias.length : 0,
      limite_carrera_msv: umbrales.radiacion_limite_carrera_msv.valor,
    }),
  };
};

const avanzar_un_dia = async (env: Env, fila: FilaEscenario, crew: Crew, perfil: FilaPerfil) => {
  const db = env.DB;
  const dia = generar_dia(config_de(fila), perfil, con_equipo_ejercicio(env), fila.dia_actual + 1);
  await escribir_dia(db, fila.crew_member_id, fila.id, dia);

  const estado = await vigilar_tripulante(db, env, perfil, fecha_del_dia(dia.fecha, 2));
  const hay_avisos = estado.alertas.length > 0;
  const primer_aviso_dia = fila.primer_aviso_dia ?? (hay_avisos ? dia.dia : null);
  const antes_del_cambio = hay_avisos && (fila.dia_inicio_cambios === null || dia.dia < fila.dia_inicio_cambios) && !dia.evento;
  const persistente = hay_avisos && fila.primer_aviso_dia !== null && fila.primer_aviso_dia < dia.dia;
  const grave = estado.alertas.some((alerta) => alerta.gravedad === 'rojo') || estado.alertas.length >= 2;

  let caso_preventivo_id = fila.caso_preventivo_id;
  if (!caso_preventivo_id && hay_avisos && (grave || persistente) && !dia.evento) {
    const resultado = await crear_caso(env, crew, { descripcion: descripcion_preventiva, sintomas: dia.sintomas }, dia.fecha);
    if (resultado.ok) {
      caso_preventivo_id = resultado.caso.id;
      await db.prepare('UPDATE casos_doctor SET creado_en = ? WHERE id = ?').bind(en_el_pasado(dia.fecha, '20:00'), caso_preventivo_id).run();
    }
  }

  let caso_seguimiento_id = fila.caso_seguimiento_id;
  if (fila.caso_preventivo_id && !caso_seguimiento_id && !dia.evento && dia.sintomas.length > 0) {
    const previo = await db.prepare('SELECT sintomas FROM casos_doctor WHERE id = ?').bind(fila.caso_preventivo_id).first<{ sintomas: string }>();
    const ya_reportados = new Set(JSON.parse(previo?.sintomas ?? '[]') as string[]);
    if (dia.sintomas.some((sintoma) => !ya_reportados.has(sintoma))) {
      const resultado = await crear_caso(env, crew, { descripcion: descripcion_seguimiento, sintomas: dia.sintomas }, dia.fecha);
      if (resultado.ok) {
        caso_seguimiento_id = resultado.caso.id;
        await db.prepare('UPDATE casos_doctor SET creado_en = ? WHERE id = ?').bind(en_el_pasado(dia.fecha, '20:00'), caso_seguimiento_id).run();
      }
    }
  }

  let emergencia_id = fila.emergencia_id;
  let caso_evento_id = fila.caso_evento_id;
  if (dia.evento && !emergencia_id) {
    const emergencia = await crear_emergencia(db, fila.crew_member_id, { origen: 'tripulacion', reportada_por: 'Crew report', descripcion: dia.evento.info });
    const reportada = en_el_pasado(dia.fecha, '14:05');
    await db
      .prepare('UPDATE emergencias SET creada_en = ?, vence_en = ? WHERE id = ?')
      .bind(reportada, new Date(Math.min(Date.parse(reportada) + 20_000, Date.now() - 1000)).toISOString(), emergencia.id)
      .run();
    emergencia_id = emergencia.id;
    const sintomas = [...new Set([...dia.sintomas, ...dia.evento.sintomas])];
    const resultado = await crear_caso(env, crew, { emergencia_id: emergencia.id, sintomas }, dia.fecha);
    if (resultado.ok) {
      caso_evento_id = resultado.caso.id;
      await db.prepare('UPDATE casos_doctor SET creado_en = ? WHERE id = ?').bind(en_el_pasado(dia.fecha, '14:10'), caso_evento_id).run();
    }
  }

  const abiertos: DiaHistorial['abiertos'] = [
    ...(caso_preventivo_id !== fila.caso_preventivo_id ? (['preventivo'] as const) : []),
    ...(caso_seguimiento_id !== fila.caso_seguimiento_id ? (['seguimiento'] as const) : []),
    ...(caso_evento_id !== fila.caso_evento_id ? (['evento'] as const) : []),
  ];
  const historial: DiaHistorial[] = [
    ...(JSON.parse(fila.historial) as DiaHistorial[]),
    { dia: dia.dia, color: estado.color_general, alertas: estado.alertas.map((alerta) => alerta.codigo), abiertos },
  ];

  await db
    .prepare(
      `UPDATE escenarios_sim SET dia_actual = ?, estado = ?, primer_aviso_dia = ?, avisos_antes_del_cambio = avisos_antes_del_cambio + ?,
         caso_preventivo_id = ?, caso_seguimiento_id = ?, emergencia_id = ?, caso_evento_id = ?, historial = ? WHERE id = ?`,
    )
    .bind(
      dia.dia, dia.dia >= fila.dias_totales ? 'terminado' : 'activo', primer_aviso_dia, antes_del_cambio ? 1 : 0,
      caso_preventivo_id, caso_seguimiento_id, emergencia_id, caso_evento_id, JSON.stringify(historial), fila.id,
    )
    .run();
  return (await buscar_escenario(db, fila.id))!;
};

const contenido = (plantilla: Pick<Plantilla, 'cambios' | 'sintomas' | 'condicion_prevencion' | 'evento'>) =>
  JSON.stringify([plantilla.cambios, plantilla.sintomas, plantilla.condicion_prevencion, plantilla.evento]);

export const rutas_simulador = new Hono<AppEnv>()
  .get('/templates', (c) =>
    c.json({
      plantillas: plantillas.map((plantilla) => ({
        ...plantilla,
        condicion_prevencion_nombre: condicion(plantilla.condicion_prevencion)?.nombre ?? null,
        condicion_evento_nombre: condicion(plantilla.evento?.condicion ?? null)?.nombre ?? null,
      })),
      campos,
      signos_evento,
      condiciones: catalogo.condiciones.map(({ id, nombre }) => ({ id, nombre })),
    }),
  )
  .get('/crew', async (c) => {
    const db = c.env.DB;
    const { results } = await db
      .prepare(
        `SELECT c.id,
                (SELECT id FROM escenarios_sim e WHERE e.crew_member_id = c.id AND e.estado <> 'reemplazado' ORDER BY e.creado_en DESC LIMIT 1) AS escenario_id
         FROM crew_members c JOIN perfiles p ON p.crew_member_id = c.id WHERE c.is_demo = 1 ORDER BY c.rowid`,
      )
      .all<{ id: string; escenario_id: string | null }>();
    const tripulacion = await Promise.all(
      results.map(async (fila) => {
        const [crew, perfil] = await Promise.all([cargar_crew(db, fila.id), cargar_perfil(db, fila.id)]);
        return crew && perfil ? { ...describir_astronauta(perfil, crew, c.env), escenario_id: fila.escenario_id } : null;
      }),
    );
    return c.json({ tripulacion: tripulacion.filter((persona) => persona !== null) });
  })
  .post('/scenarios', validate('json', escenario_schema), async (c) => {
    const datos = c.req.valid('json');
    const db = c.env.DB;
    const base = buscar_plantilla(datos.plantilla);
    if (!base) return c.json({ error: 'unknown_template' }, 404);
    const [crew, perfil] = await Promise.all([cargar_crew(db, datos.crew_id), cargar_perfil(db, datos.crew_id)]);
    if (!crew || !perfil) return c.json({ error: 'not_found', message: 'Demo crew member with an Earth profile not found' }, 404);

    const borrador = {
      cambios: datos.cambios ?? base.cambios,
      sintomas: datos.sintomas !== undefined ? datos.sintomas : base.sintomas,
      condicion_prevencion: datos.condicion_prevencion !== undefined ? datos.condicion_prevencion || null : base.condicion_prevencion,
      evento: datos.evento !== undefined ? datos.evento : base.evento,
    };
    for (const id of [borrador.condicion_prevencion, borrador.evento?.condicion ?? null]) {
      if (id && !buscar_condicion(id)) return c.json({ error: 'unknown_condition', message: `"${id}" is not in the condition catalog` }, 400);
    }
    const personalizado = contenido(borrador) !== contenido(base) || (datos.titulo !== undefined && datos.titulo !== base.titulo);
    const plantilla: Plantilla = {
      ...base,
      ...borrador,
      titulo: datos.titulo ?? base.titulo,
      tipo: tipo_de(borrador),
      descripcion: personalizado ? `Custom scenario built in the panel from "${base.titulo}".` : base.descripcion,
    };

    const dias_totales = datos.dias_totales ?? base.dias_recomendados;
    const gradual = plantilla.cambios.length > 0 || plantilla.sintomas !== null;
    const dia_inicio_cambios = gradual ? (datos.dia_inicio_cambios ?? Math.min(base.inicio_cambios_recomendado ?? 7, dias_totales)) : null;
    const dia_evento = plantilla.evento ? (datos.dia_evento ?? dias_totales) : null;
    if (dia_inicio_cambios !== null && dia_inicio_cambios > dias_totales) {
      return c.json({ error: 'invalid_request', message: 'The change day must fall inside the scenario' }, 400);
    }
    if (dia_evento !== null && (dia_evento > dias_totales || (dia_inicio_cambios !== null && dia_evento <= dia_inicio_cambios))) {
      return c.json({ error: 'invalid_request', message: 'The event day must fall inside the scenario and after the change day' }, 400);
    }

    const linea_base: LineaBase = { ...calcular_linea_base(crew.id), ...datos.linea_base };
    const configuracion: Configuracion = { plantilla, linea_base, personalizado };

    await db.prepare("UPDATE escenarios_sim SET estado = 'reemplazado' WHERE crew_member_id = ? AND estado <> 'reemplazado'").bind(crew.id).run();
    await deleteCrewData(db, crew.id);
    const id = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO escenarios_sim (id, crew_member_id, plantilla, configuracion, dias_totales, dia_inicio_cambios, dia_evento, fecha_base, estado, creado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'activo', ?)`,
      )
      .bind(id, crew.id, base.id, JSON.stringify(configuracion), dias_totales, dia_inicio_cambios, dia_evento, fecha_hace(0), new Date().toISOString())
      .run();
    return c.json(await armar_estado(c.env, (await buscar_escenario(db, id))!), 201);
  })
  .get('/scenarios/:id', async (c) => {
    const fila = await buscar_escenario(c.env.DB, c.req.param('id'));
    if (!fila) return c.json({ error: 'not_found' }, 404);
    return c.json(await armar_estado(c.env, fila));
  })
  .post('/scenarios/:id/advance', validate('json', avanzar_schema), async (c) => {
    const db = c.env.DB;
    let fila = await buscar_escenario(db, c.req.param('id'));
    if (!fila) return c.json({ error: 'not_found' }, 404);
    if (fila.estado !== 'activo') return c.json({ error: 'scenario_closed', message: `This scenario is ${fila.estado}` }, 409);
    const [crew, perfil] = await Promise.all([cargar_crew(db, fila.crew_member_id), cargar_perfil(db, fila.crew_member_id)]);
    if (!crew || !perfil) return c.json({ error: 'not_found', message: 'Crew member not found' }, 404);

    const { dias } = c.req.valid('json');
    fila = await anclar_a_hoy(db, fila, dias);
    for (let paso = 0; paso < dias && fila.estado === 'activo'; paso += 1) {
      fila = await avanzar_un_dia(c.env, fila, crew, perfil);
    }
    return c.json(await armar_estado(c.env, fila));
  });
