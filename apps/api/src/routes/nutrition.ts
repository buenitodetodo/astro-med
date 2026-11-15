import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { validate } from '../validate';
import { calcular_balance, calcular_requerimientos, fuente_macros, fuente_nutricion } from '../health/calculator';
import { cargar_dias, cargar_perfil, con_equipo_ejercicio, fecha_hace } from '../health/data';
import { redondear } from '../health/numbers';
import { rango_fechas_schema } from '../health/schemas';

const rango = (valores: { minimo: number; maximo: number }, decimales = 0) => ({
  minimo: redondear(valores.minimo, decimales),
  maximo: redondear(valores.maximo, decimales),
});

export const rutas_nutricion = new Hono<AppEnv>().get('/', validate('query', rango_fechas_schema), async (c) => {
  const perfil = await cargar_perfil(c.env.DB, c.var.crew.id);
  if (!perfil) return c.json({ error: 'profile_missing' }, 404);

  const { desde = fecha_hace(13), hasta = fecha_hace(0) } = c.req.valid('query');
  const dias = await cargar_dias(c.env.DB, c.var.crew.id, desde, hasta);
  const equipo = con_equipo_ejercicio(c.env);
  const requerimientos = calcular_requerimientos(perfil, equipo);
  const balance = calcular_balance(perfil, equipo, dias);

  return c.json({
    fuente: fuente_nutricion,
    fuente_macros,
    requerimientos: {
      factor_actividad: requerimientos.factor_actividad,
      energia_kcal: redondear(requerimientos.energia_kcal, 0),
      kcal_extra_por_hora_caminata: requerimientos.kcal_extra_por_hora_caminata,
      proteina_g: rango(requerimientos.proteina_g, 1),
      carbohidratos_g: rango(requerimientos.carbohidratos_g),
      grasas_g: rango(requerimientos.grasas_g),
      liquidos_ml: redondear(requerimientos.liquidos_ml, 0),
    },
    dias: balance.dias.map((dia) => ({
      fecha: dia.fecha,
      kcal: dia.kcal,
      requerimiento_kcal: redondear(dia.requerimiento_kcal, 0),
      balance_kcal: redondear(dia.balance_kcal, 0),
      proteina_g: dia.proteina_g,
      falta_proteina_g: redondear(dia.falta_proteina_g),
      carbohidratos_g: dia.carbohidratos_g,
      grasas_g: dia.grasas_g,
      liquidos_ml: dia.liquidos_ml,
      falta_liquidos_ml: redondear(dia.falta_liquidos_ml, 0),
    })),
    resumen: { ...balance.resumen, balance_acumulado_kcal: redondear(balance.resumen.balance_acumulado_kcal, 0) },
  });
});
