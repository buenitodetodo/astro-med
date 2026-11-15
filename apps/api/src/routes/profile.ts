import { Hono } from 'hono';
import { audit } from '../store';
import type { AppEnv, Crew } from '../types';
import { validate } from '../validate';
import { cargar_perfil, type FilaPerfil } from '../health/data';
import { redondear } from '../health/numbers';
import { perfil_schema } from '../health/schemas';

export const armar_perfil = (perfil: FilaPerfil, crew: Crew) => ({
  crew_member_id: perfil.crew_member_id,
  nombre: perfil.nombre,
  callsign: crew.callsign,
  rol: crew.role,
  edad: perfil.edad,
  sexo: perfil.sexo,
  peso_kg: perfil.peso_kg,
  estatura_m: perfil.estatura_m,
  imc: redondear(perfil.peso_kg / perfil.estatura_m ** 2),
  porcentaje_grasa: perfil.porcentaje_grasa,
  masa_muscular_kg: perfil.masa_muscular_kg,
  tipo_sangre: perfil.tipo_sangre,
  alergias: JSON.parse(perfil.alergias) as string[],
  antecedentes: JSON.parse(perfil.antecedentes) as string[],
  actualizado_en: perfil.actualizado_en,
});

export const rutas_perfil = new Hono<AppEnv>()
  .get('/', async (c) => {
    const perfil = await cargar_perfil(c.env.DB, c.var.crew.id);
    if (!perfil) return c.json({ error: 'profile_missing' }, 404);
    await audit(c.env.DB, c.var.crew.id, 'read', 'profile');
    return c.json(armar_perfil(perfil, c.var.crew));
  })
  .put('/', validate('json', perfil_schema), async (c) => {
    const datos = c.req.valid('json');
    await c.env.DB.prepare(
      `INSERT INTO perfiles (crew_member_id, nombre, edad, sexo, peso_kg, estatura_m, porcentaje_grasa, masa_muscular_kg, tipo_sangre, alergias, antecedentes, actualizado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (crew_member_id) DO UPDATE SET
         nombre = excluded.nombre, edad = excluded.edad, sexo = excluded.sexo, peso_kg = excluded.peso_kg,
         estatura_m = excluded.estatura_m, porcentaje_grasa = excluded.porcentaje_grasa, masa_muscular_kg = excluded.masa_muscular_kg,
         tipo_sangre = excluded.tipo_sangre, alergias = excluded.alergias, antecedentes = excluded.antecedentes, actualizado_en = excluded.actualizado_en`,
    )
      .bind(
        c.var.crew.id,
        datos.nombre,
        datos.edad,
        datos.sexo,
        datos.peso_kg,
        datos.estatura_m,
        datos.porcentaje_grasa ?? null,
        datos.masa_muscular_kg ?? null,
        datos.tipo_sangre ?? null,
        JSON.stringify(datos.alergias),
        JSON.stringify(datos.antecedentes),
        new Date().toISOString(),
      )
      .run();
    await audit(c.env.DB, c.var.crew.id, 'write', 'profile');
    return c.json(armar_perfil((await cargar_perfil(c.env.DB, c.var.crew.id))!, c.var.crew));
  });
