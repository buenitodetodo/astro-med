import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../types';
import { hoy_utc, validate } from '../validate';
import { buscar_racion, catalogo_raciones } from '../health/content';
import { comida_schema } from '../health/schemas';

type FilaComida = {
  id: string;
  fecha: string;
  comido_en: string;
  codigo: string | null;
  nombre: string;
  kcal: number;
  proteina_g: number;
  carbohidratos_g: number;
  grasas_g: number;
  liquidos_ml: number;
};

const columnas = 'id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml';

const sumar = (comidas: FilaComida[]) => ({
  kcal: comidas.reduce((suma, comida) => suma + comida.kcal, 0),
  proteina_g: comidas.reduce((suma, comida) => suma + comida.proteina_g, 0),
  carbohidratos_g: comidas.reduce((suma, comida) => suma + comida.carbohidratos_g, 0),
  grasas_g: comidas.reduce((suma, comida) => suma + comida.grasas_g, 0),
  liquidos_ml: comidas.reduce((suma, comida) => suma + comida.liquidos_ml, 0),
});

export const rutas_comidas = new Hono<AppEnv>()
  .get('/rations', (c) => c.json(catalogo_raciones))
  .get('/', validate('query', z.object({ fecha: z.iso.date().optional() })), async (c) => {
    const fecha = c.req.valid('query').fecha ?? hoy_utc();
    const { results } = await c.env.DB.prepare(`SELECT ${columnas} FROM comidas WHERE crew_member_id = ? AND fecha = ? ORDER BY comido_en`)
      .bind(c.var.crew.id, fecha)
      .all<FilaComida>();
    return c.json({ fecha, comidas: results, totales: sumar(results) });
  })
  .post('/', validate('json', comida_schema), async (c) => {
    const datos = c.req.valid('json');
    const db = c.env.DB;
    const crew_id = c.var.crew.id;

    const existente = await db.prepare(`SELECT ${columnas}, crew_member_id FROM comidas WHERE id = ?`).bind(datos.id).first<FilaComida & { crew_member_id: string }>();
    if (existente) {
      if (existente.crew_member_id !== crew_id) return c.json({ error: 'conflict', message: 'meal id unavailable' }, 409);
      const { crew_member_id: _dueno, ...comida } = existente;
      return c.json({ ...comida, duplicado: true }, 200);
    }

    const racion = datos.codigo ? buscar_racion(datos.codigo) : undefined;
    if (datos.codigo && !racion) return c.json({ error: 'unknown_ration', message: `No ration with code ${datos.codigo}` }, 404);

    const comido_en = datos.comido_en ? new Date(datos.comido_en).toISOString() : new Date().toISOString();
    const comida: FilaComida = {
      id: datos.id,
      fecha: comido_en.slice(0, 10),
      comido_en,
      codigo: racion?.codigo ?? null,
      nombre: datos.nombre ?? racion?.nombre ?? 'Meal',
      kcal: datos.kcal ?? racion?.kcal ?? 0,
      proteina_g: datos.proteina_g ?? racion?.proteina_g ?? 0,
      carbohidratos_g: datos.carbohidratos_g ?? racion?.carbohidratos_g ?? 0,
      grasas_g: datos.grasas_g ?? racion?.grasas_g ?? 0,
      liquidos_ml: datos.liquidos_ml ?? racion?.liquidos_ml ?? 0,
    };
    await db
      .prepare(
        `INSERT INTO comidas (${columnas}, crew_member_id, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        comida.id, comida.fecha, comida.comido_en, comida.codigo, comida.nombre, comida.kcal,
        comida.proteina_g, comida.carbohidratos_g, comida.grasas_g, comida.liquidos_ml, crew_id, new Date().toISOString(),
      )
      .run();
    return c.json({ ...comida, duplicado: false }, 201);
  });
