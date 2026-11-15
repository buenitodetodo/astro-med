import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { validate } from '../validate';
import { cargar_dias, fecha_hace } from '../health/data';
import { bitacora_schema, rango_fechas_schema } from '../health/schemas';

type FilaBitacora = {
  sueno_horas: number | null;
  sueno_calidad: number | null;
  ejercicio: string;
  caminata_espacial_horas: number;
  animo: number | null;
  sintomas: string;
};

export const rutas_bitacora = new Hono<AppEnv>()
  .get('/', validate('query', rango_fechas_schema), async (c) => {
    const { desde = fecha_hace(13), hasta = fecha_hace(0) } = c.req.valid('query');
    return c.json({ dias: await cargar_dias(c.env.DB, c.var.crew.id, desde, hasta) });
  })
  .post('/', validate('json', bitacora_schema), async (c) => {
    const datos = c.req.valid('json');
    const db = c.env.DB;
    const crew_id = c.var.crew.id;
    const existente = await db
      .prepare('SELECT sueno_horas, sueno_calidad, ejercicio, caminata_espacial_horas, animo, sintomas FROM bitacora WHERE crew_member_id = ? AND fecha = ?')
      .bind(crew_id, datos.fecha)
      .first<FilaBitacora>();

    await db
      .prepare(
        `INSERT INTO bitacora (crew_member_id, fecha, sueno_horas, sueno_calidad, ejercicio, caminata_espacial_horas, animo, sintomas, actualizado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (crew_member_id, fecha) DO UPDATE SET
           sueno_horas = excluded.sueno_horas, sueno_calidad = excluded.sueno_calidad, ejercicio = excluded.ejercicio,
           caminata_espacial_horas = excluded.caminata_espacial_horas, animo = excluded.animo, sintomas = excluded.sintomas,
           actualizado_en = excluded.actualizado_en`,
      )
      .bind(
        crew_id,
        datos.fecha,
        datos.sueno?.horas ?? existente?.sueno_horas ?? null,
        datos.sueno?.calidad ?? existente?.sueno_calidad ?? null,
        datos.ejercicio ? JSON.stringify(datos.ejercicio) : (existente?.ejercicio ?? '[]'),
        datos.caminata_espacial_horas ?? existente?.caminata_espacial_horas ?? 0,
        datos.animo ?? existente?.animo ?? null,
        datos.sintomas ? JSON.stringify(datos.sintomas) : (existente?.sintomas ?? '[]'),
        new Date().toISOString(),
      )
      .run();

    const [dia] = await cargar_dias(db, crew_id, datos.fecha, datos.fecha);
    return c.json(dia, existente ? 200 : 201);
  });
