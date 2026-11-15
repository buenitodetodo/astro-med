import { VITAL_METRICS, type Metric, type VitalField } from '@astro-med/shared';
import type { Sexo } from './calculator';
import { vigilar, type DiaVigilado, type Dosis, type Lectura } from './watcher';

const ms_por_dia = 86_400_000;

export type FilaPerfil = {
  crew_member_id: string;
  nombre: string;
  edad: number;
  sexo: Sexo;
  peso_kg: number;
  estatura_m: number;
  porcentaje_grasa: number | null;
  masa_muscular_kg: number | null;
  tipo_sangre: string | null;
  alergias: string;
  antecedentes: string;
  actualizado_en: string;
};

export type Dia = DiaVigilado & {
  sueno_calidad: number | null;
  animo: number | null;
  sintomas: string[];
  comidas: number;
};

export type LecturaConFuente = Lectura & { fuente: string };

type FilaBitacora = {
  fecha: string;
  sueno_horas: number | null;
  sueno_calidad: number | null;
  ejercicio: string;
  caminata_espacial_horas: number;
  animo: number | null;
  sintomas: string;
};

type FilaTotales = {
  fecha: string;
  kcal: number;
  proteina_g: number;
  carbohidratos_g: number;
  grasas_g: number;
  liquidos_ml: number;
  comidas: number;
};

export const fecha_hace = (dias: number) => new Date(Date.now() - dias * ms_por_dia).toISOString().slice(0, 10);

export const con_equipo_ejercicio = (env: Env) => env.EQUIPO_EJERCICIO_EEI !== 'no';

export const cargar_perfil = (db: D1Database, crew_id: string) =>
  db.prepare('SELECT * FROM perfiles WHERE crew_member_id = ?').bind(crew_id).first<FilaPerfil>();

export const cargar_dias = async (db: D1Database, crew_id: string, desde: string, hasta: string): Promise<Dia[]> => {
  const [bitacora, totales] = await db.batch<Record<string, unknown>>([
    db
      .prepare(
        `SELECT fecha, sueno_horas, sueno_calidad, ejercicio, caminata_espacial_horas, animo, sintomas
         FROM bitacora WHERE crew_member_id = ?1 AND fecha BETWEEN ?2 AND ?3`,
      )
      .bind(crew_id, desde, hasta),
    db
      .prepare(
        `SELECT fecha, SUM(kcal) AS kcal, SUM(proteina_g) AS proteina_g, SUM(carbohidratos_g) AS carbohidratos_g,
                SUM(grasas_g) AS grasas_g, SUM(liquidos_ml) AS liquidos_ml, COUNT(*) AS comidas
         FROM comidas WHERE crew_member_id = ?1 AND fecha BETWEEN ?2 AND ?3 GROUP BY fecha`,
      )
      .bind(crew_id, desde, hasta),
  ]);
  const filas_bitacora = new Map((bitacora?.results as unknown as FilaBitacora[]).map((fila) => [fila.fecha, fila]));
  const filas_totales = new Map((totales?.results as unknown as FilaTotales[]).map((fila) => [fila.fecha, fila]));
  const fechas = [...new Set([...filas_bitacora.keys(), ...filas_totales.keys()])].toSorted();

  return fechas.map((fecha) => {
    const dia = filas_bitacora.get(fecha);
    const comida = filas_totales.get(fecha);
    return {
      fecha,
      kcal: comida?.kcal ?? null,
      proteina_g: comida?.proteina_g ?? null,
      carbohidratos_g: comida?.carbohidratos_g ?? null,
      grasas_g: comida?.grasas_g ?? null,
      liquidos_ml: comida?.liquidos_ml ?? null,
      comidas: comida?.comidas ?? 0,
      caminata_espacial_horas: dia?.caminata_espacial_horas ?? 0,
      sueno_horas: dia?.sueno_horas ?? null,
      sueno_calidad: dia?.sueno_calidad ?? null,
      ejercicio: dia ? (JSON.parse(dia.ejercicio) as Dia['ejercicio']) : [],
      animo: dia?.animo ?? null,
      sintomas: dia ? (JSON.parse(dia.sintomas) as string[]) : [],
    };
  });
};

const campo_de_metrica = Object.fromEntries(
  (Object.entries(VITAL_METRICS) as [VitalField, Metric][]).map(([campo, metrica]) => [metrica, campo]),
) as Record<string, VitalField>;

export const cargar_lecturas = async (db: D1Database, crew_id: string, desde: string): Promise<LecturaConFuente[]> => {
  const metricas = Object.values(VITAL_METRICS);
  const { results } = await db
    .prepare(
      `SELECT metric, value, source, observed_at FROM health_observations
       WHERE crew_member_id = ? AND observed_at >= ? AND quality = 'ok' AND metric IN (${metricas.map(() => '?').join(',')})
       ORDER BY observed_at`,
    )
    .bind(crew_id, desde, ...metricas)
    .all<{ metric: string; value: number; source: string; observed_at: string }>();

  const lecturas = new Map<string, LecturaConFuente>();
  for (const fila of results) {
    const lectura = lecturas.get(fila.observed_at) ?? {
      registrado_en: fila.observed_at,
      fuente: fila.source,
      pulso_lpm: null,
      hrv_ms: null,
      presion_sistolica: null,
      presion_diastolica: null,
      temperatura_c: null,
      spo2: null,
    };
    const campo = campo_de_metrica[fila.metric];
    if (campo) lectura[campo] = fila.value;
    lecturas.set(fila.observed_at, lectura);
  }
  return [...lecturas.values()];
};

export const cargar_dosis = async (db: D1Database, crew_id: string): Promise<Dosis[]> => {
  const { results } = await db
    .prepare(
      `SELECT observed_at AS observado_en, value AS msv FROM health_observations
       WHERE crew_member_id = ? AND metric = 'radiation_dose' AND quality = 'ok' ORDER BY observed_at`,
    )
    .bind(crew_id)
    .all<Dosis>();
  return results;
};

export const vigilar_tripulante = async (db: D1Database, env: Env, perfil: FilaPerfil, hoy?: string) => {
  const [dias, lecturas, dosis] = await Promise.all([
    cargar_dias(db, perfil.crew_member_id, fecha_hace(30), fecha_hace(-1)),
    cargar_lecturas(db, perfil.crew_member_id, `${fecha_hace(30)}T00:00:00Z`),
    cargar_dosis(db, perfil.crew_member_id),
  ]);
  return vigilar(perfil, con_equipo_ejercicio(env), dias, lecturas, dosis, hoy);
};
