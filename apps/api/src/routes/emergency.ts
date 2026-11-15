import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { validate } from '../validate';
import { tarjeta_generica } from '../health/content';
import { cargar_perfil } from '../health/data';
import { emergencia_schema } from '../health/schemas';

export const segundos_para_cancelar = 7;

export type FilaEmergencia = {
  id: string;
  crew_member_id: string;
  origen: string;
  reportada_por: string | null;
  descripcion: string | null;
  creada_en: string;
  vence_en: string;
  cancelada_en: string | null;
};

export type EstadoEmergencia = 'en_verificacion' | 'cancelada' | 'confirmada';

const estado_del_doctor = { en_verificacion: 'en_espera', cancelada: 'no_requerido', confirmada: 'pendiente' } as const;

export const buscar_emergencia = (db: D1Database, crew_id: string, id: string) =>
  db.prepare('SELECT * FROM emergencias WHERE id = ? AND crew_member_id = ?').bind(id, crew_id).first<FilaEmergencia>();

export const calcular_estado = (emergencia: FilaEmergencia, ahora: number): EstadoEmergencia => {
  if (emergencia.cancelada_en) return 'cancelada';
  return ahora < Date.parse(emergencia.vence_en) ? 'en_verificacion' : 'confirmada';
};

const armar_respuesta = async (db: D1Database, emergencia: FilaEmergencia) => {
  const ahora = Date.now();
  const estado = calcular_estado(emergencia, ahora);
  const [perfil, caso_doctor] = await Promise.all([
    cargar_perfil(db, emergencia.crew_member_id),
    db
      .prepare('SELECT id, estado FROM casos_doctor WHERE emergencia_id = ? ORDER BY creado_en DESC LIMIT 1')
      .bind(emergencia.id)
      .first<{ id: string; estado: string }>(),
  ]);

  return {
    ...emergencia,
    estado,
    segundos_restantes: estado === 'en_verificacion' ? Math.ceil((Date.parse(emergencia.vence_en) - ahora) / 1000) : 0,
    verificacion: { pregunta: 'Are you okay?', segundos_para_cancelar },
    doctor_ia: caso_doctor?.estado ?? estado_del_doctor[estado],
    caso_doctor_id: caso_doctor?.id ?? null,
    datos_criticos: {
      nombre: perfil?.nombre ?? null,
      edad: perfil?.edad ?? null,
      sexo: perfil?.sexo ?? null,
      peso_kg: perfil?.peso_kg ?? null,
      tipo_sangre: perfil?.tipo_sangre ?? null,
      alergias: perfil ? (JSON.parse(perfil.alergias) as string[]) : [],
      antecedentes: perfil ? (JSON.parse(perfil.antecedentes) as string[]) : [],
    },
    tarjeta: tarjeta_generica,
  };
};

type DatosEmergencia = { origen: 'sos' | 'tripulacion' | 'vigilante'; reportada_por?: string; descripcion?: string };

export const crear_emergencia = async (db: D1Database, crew_id: string, datos: DatosEmergencia) => {
  const ahora = new Date();
  const en_verificacion = await db
    .prepare('SELECT * FROM emergencias WHERE crew_member_id = ? AND cancelada_en IS NULL AND vence_en > ? ORDER BY creada_en DESC LIMIT 1')
    .bind(crew_id, ahora.toISOString())
    .first<FilaEmergencia>();
  if (en_verificacion) return { ...(await armar_respuesta(db, en_verificacion)), duplicada: true };

  const id = crypto.randomUUID();
  await db
    .prepare('INSERT INTO emergencias (id, crew_member_id, origen, reportada_por, descripcion, creada_en, vence_en) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(
      id,
      crew_id,
      datos.origen,
      datos.reportada_por ?? null,
      datos.descripcion ?? null,
      ahora.toISOString(),
      new Date(ahora.getTime() + segundos_para_cancelar * 1000).toISOString(),
    )
    .run();
  return { ...(await armar_respuesta(db, (await buscar_emergencia(db, crew_id, id))!)), duplicada: false };
};

export const rutas_emergencia = new Hono<AppEnv>()
  .post('/', validate('json', emergencia_schema), async (c) => {
    const emergencia = await crear_emergencia(c.env.DB, c.var.crew.id, c.req.valid('json'));
    return c.json(emergencia, emergencia.duplicada ? 200 : 201);
  })
  .get('/:id', async (c) => {
    const emergencia = await buscar_emergencia(c.env.DB, c.var.crew.id, c.req.param('id'));
    if (!emergencia) return c.json({ error: 'not_found' }, 404);
    return c.json(await armar_respuesta(c.env.DB, emergencia));
  })
  .post('/:id/cancel', async (c) => {
    const db = c.env.DB;
    const emergencia = await buscar_emergencia(db, c.var.crew.id, c.req.param('id'));
    if (!emergencia) return c.json({ error: 'not_found' }, 404);

    const estado = calcular_estado(emergencia, Date.now());
    if (estado === 'confirmada') {
      return c.json(
        {
          error: 'already_confirmed',
          message: `The ${segundos_para_cancelar} s have passed: the emergency is confirmed and cannot be cancelled.`,
          emergencia: await armar_respuesta(db, emergencia),
        },
        409,
      );
    }
    if (estado === 'en_verificacion') {
      await db.prepare('UPDATE emergencias SET cancelada_en = ? WHERE id = ?').bind(new Date().toISOString(), emergencia.id).run();
    }
    return c.json(await armar_respuesta(db, (await buscar_emergencia(db, c.var.crew.id, emergencia.id))!));
  });
