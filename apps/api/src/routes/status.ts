import { Hono } from 'hono';
import { audit } from '../store';
import type { AppEnv } from '../types';
import { cargar_perfil, vigilar_tripulante } from '../health/data';

export const rutas_estado = new Hono<AppEnv>().get('/', async (c) => {
  const perfil = await cargar_perfil(c.env.DB, c.var.crew.id);
  if (!perfil) return c.json({ error: 'profile_missing' }, 404);

  const resultado = await vigilar_tripulante(c.env.DB, c.env, perfil);
  const alerta_principal = resultado.alertas[0];
  await audit(c.env.DB, c.var.crew.id, 'read', 'status');

  return c.json({
    crew_member_id: perfil.crew_member_id,
    color_general: resultado.color_general,
    fecha_bitacora: resultado.fecha_bitacora,
    fecha_signos: resultado.fecha_signos,
    semaforo: resultado.evaluaciones.map((evaluacion) => ({
      parametro: evaluacion.parametro,
      color: evaluacion.color,
      mensaje: evaluacion.mensaje,
      datos: evaluacion.datos,
      fuente: evaluacion.fuente,
      alertas: evaluacion.alertas.length,
    })),
    recomendacion_del_dia: alerta_principal
      ? {
          mensaje: alerta_principal.recomendacion,
          motivo: alerta_principal.mensaje,
          parametro: alerta_principal.parametro,
          fuente: alerta_principal.fuente,
        }
      : { mensaje: 'No alerts. Keep your meal, sleep and exercise plan.', motivo: null, parametro: null, fuente: null },
    alertas: resultado.alertas,
    total_alertas: resultado.alertas.length,
  });
});
