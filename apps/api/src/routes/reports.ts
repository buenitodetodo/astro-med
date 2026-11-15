import { Hono } from 'hono';
import { z } from 'zod';
import { audit } from '../store';
import type { AppEnv } from '../types';
import { validate } from '../validate';
import { cargar_lecturas, cargar_perfil, fecha_hace, vigilar_tripulante } from '../health/data';
import type { Resultado } from '../health/doctor';
import { config_del_chat, describir_error, leer_config, preguntar_lmstudio, quitar_razonamiento } from '../health/models';
import { armar_texto, armar_titulo, calcular_transmision, type ContenidoReporte } from '../health/report';
import { buscar_emergencia, calcular_estado } from './emergency';

type FilaReporte = {
  id: string;
  crew_member_id: string;
  emergencia_id: string | null;
  caso_doctor_id: string | null;
  titulo: string;
  contenido: string;
  texto: string;
  resumen_ia: string | null;
  modelo_resumen: string | null;
  estado: 'borrador' | 'aprobado';
  creado_en: string;
  aprobado_en: string | null;
  aprobado_por: string | null;
  retraso_minutos: number | null;
  aceleracion: number | null;
  llega_en: string | null;
  respuesta_en: string | null;
};

type FilaCaso = { id: string; estado: string; error: string | null; resultado: string | null };

const reporte_schema = z.object({
  emergencia_id: z.uuid().optional(),
  caso_doctor_id: z.uuid().optional(),
  notas: z.string().trim().min(1).max(2000).optional(),
});

const aprobacion_schema = z.object({ aprobado_por: z.string().trim().min(1).max(100).optional() });

const limite_resumen_ms = 60_000;

const leer_retraso = (env: Env) => {
  const minutos = Number(env.RETRASO_TIERRA_MINUTOS || 12);
  const aceleracion = Number(env.ACELERACION_DEMO || 1);
  return {
    minutos: Number.isFinite(minutos) && minutos >= 0 && minutos <= 60 ? minutos : 12,
    aceleracion: Number.isFinite(aceleracion) && aceleracion >= 1 && aceleracion <= 3600 ? aceleracion : 1,
  };
};

const buscar_reporte = (db: D1Database, crew_id: string, id: string) =>
  db.prepare('SELECT * FROM reportes WHERE id = ? AND crew_member_id = ?').bind(id, crew_id).first<FilaReporte>();

const armar_respuesta = (fila: FilaReporte) => {
  const contenido = JSON.parse(fila.contenido) as ContenidoReporte;
  const transmision =
    fila.estado === 'aprobado' && fila.aprobado_en && fila.llega_en && fila.respuesta_en
      ? calcular_transmision(
          { aprobado_en: fila.aprobado_en, llega_en: fila.llega_en, respuesta_en: fila.respuesta_en, retraso_minutos: fila.retraso_minutos ?? 0, aceleracion: fila.aceleracion ?? 1 },
          contenido,
        )
      : null;
  return {
    id: fila.id,
    estado: fila.estado,
    titulo: fila.titulo,
    emergencia_id: fila.emergencia_id,
    caso_doctor_id: fila.caso_doctor_id,
    creado_en: fila.creado_en,
    aprobado_en: fila.aprobado_en,
    aprobado_por: fila.aprobado_por,
    texto: fila.texto,
    resumen_ia: fila.resumen_ia
      ? { texto: fila.resumen_ia, modelo: fila.modelo_resumen, etiqueta: 'AI summary, not validated by a physician' }
      : null,
    contenido,
    transmision,
  };
};

export const rutas_reportes = new Hono<AppEnv>()
  .post('/', validate('json', reporte_schema), async (c) => {
    const datos = c.req.valid('json');
    const db = c.env.DB;
    const crew = c.var.crew;
    const perfil = await cargar_perfil(db, crew.id);
    if (!perfil) return c.json({ error: 'profile_missing' }, 404);

    const emergencia = datos.emergencia_id ? await buscar_emergencia(db, crew.id, datos.emergencia_id) : null;
    if (datos.emergencia_id && !emergencia) return c.json({ error: 'not_found', message: 'Emergency not found for this crew member' }, 404);

    const caso = datos.caso_doctor_id
      ? await db.prepare('SELECT id, estado, error, resultado FROM casos_doctor WHERE id = ? AND crew_member_id = ?').bind(datos.caso_doctor_id, crew.id).first<FilaCaso>()
      : emergencia
        ? await db.prepare('SELECT id, estado, error, resultado FROM casos_doctor WHERE emergencia_id = ? ORDER BY creado_en DESC LIMIT 1').bind(emergencia.id).first<FilaCaso>()
        : null;
    if (datos.caso_doctor_id && !caso) return c.json({ error: 'not_found', message: 'AI doctor case not found for this crew member' }, 404);

    const [estado, lecturas] = await Promise.all([
      vigilar_tripulante(db, c.env, perfil),
      cargar_lecturas(db, crew.id, `${fecha_hace(2)}T00:00:00Z`),
    ]);
    const contenido: ContenidoReporte = {
      generado_en: new Date().toISOString(),
      astronauta: {
        nombre: perfil.nombre,
        rol: crew.role,
        edad: perfil.edad,
        sexo: perfil.sexo,
        peso_kg: perfil.peso_kg,
        tipo_sangre: perfil.tipo_sangre,
        alergias: JSON.parse(perfil.alergias) as string[],
        antecedentes: JSON.parse(perfil.antecedentes) as string[],
      },
      mision: {
        nombre: crew.missionName,
        fase: crew.phase,
        dia: Math.floor((Date.now() - Date.parse(crew.missionStart.replace(' ', 'T') + 'Z')) / 86400_000) + 1,
      },
      emergencia: emergencia
        ? {
            id: emergencia.id,
            origen: emergencia.origen,
            reportada_por: emergencia.reportada_por,
            descripcion: emergencia.descripcion,
            creada_en: emergencia.creada_en,
            estado: calcular_estado(emergencia, Date.now()),
          }
        : null,
      doctor: caso
        ? { caso_id: caso.id, estado: caso.estado, error: caso.error, resultado: caso.resultado ? (JSON.parse(caso.resultado) as Resultado) : null }
        : null,
      vigilante: {
        color_general: estado.color_general,
        alertas: estado.alertas.map(({ gravedad, mensaje, fuente }) => ({ gravedad, mensaje, fuente })),
      },
      signos_recientes: lecturas.slice(-3),
      notas: datos.notas ?? null,
    };
    const texto = armar_texto(contenido);

    const config = leer_config(c.env);
    let resumen_ia: string | null = null;
    try {
      resumen_ia = quitar_razonamiento(
        await preguntar_lmstudio(
          { ...config_del_chat(config), limite_ms: limite_resumen_ms },
          {
            modelo: config.chat,
            temperatura: 0.2,
            mensajes: [
              {
                role: 'user',
                content: `Summarize this report for the flight surgeon on Earth in 3 to 5 sentences, in English. Use only the facts and numbers in the report; do not add doses or new measurements.\n\n${texto}`,
              },
            ],
          },
        ),
      );
    } catch (error) {
      console.error('report_summary_unavailable', describir_error(error).slice(0, 120));
    }

    const id = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO reportes (id, crew_member_id, emergencia_id, caso_doctor_id, titulo, contenido, texto, resumen_ia, modelo_resumen, estado, creado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'borrador', ?)`,
      )
      .bind(
        id, crew.id, emergencia?.id ?? null, caso?.id ?? null, armar_titulo(contenido), JSON.stringify(contenido), texto,
        resumen_ia, resumen_ia ? config.chat : null, contenido.generado_en,
      )
      .run();
    await audit(db, crew.id, 'write', `report:${id}`);
    return c.json(armar_respuesta((await buscar_reporte(db, crew.id, id))!), 201);
  })
  .get('/:id', async (c) => {
    const fila = await buscar_reporte(c.env.DB, c.var.crew.id, c.req.param('id'));
    if (!fila) return c.json({ error: 'not_found' }, 404);
    return c.json(armar_respuesta(fila));
  })
  .patch('/:id/approve', validate('json', aprobacion_schema), async (c) => {
    const db = c.env.DB;
    const fila = await buscar_reporte(db, c.var.crew.id, c.req.param('id'));
    if (!fila) return c.json({ error: 'not_found' }, 404);

    if (fila.estado === 'borrador') {
      const { minutos, aceleracion } = leer_retraso(c.env);
      const ahora = Date.now();
      const retraso_ms = (minutos * 60_000) / aceleracion;
      await db
        .prepare(
          `UPDATE reportes SET estado = 'aprobado', aprobado_en = ?, aprobado_por = ?, retraso_minutos = ?, aceleracion = ?, llega_en = ?, respuesta_en = ?
           WHERE id = ? AND estado = 'borrador'`,
        )
        .bind(
          new Date(ahora).toISOString(),
          c.req.valid('json').aprobado_por ?? c.var.crew.callsign,
          minutos,
          aceleracion,
          new Date(ahora + retraso_ms).toISOString(),
          new Date(ahora + 2 * retraso_ms).toISOString(),
          fila.id,
        )
        .run();
      await audit(db, c.var.crew.id, 'approve', `report:${fila.id}`);
    }
    return c.json(armar_respuesta((await buscar_reporte(db, c.var.crew.id, fila.id))!));
  });

export const rutas_cola = new Hono<AppEnv>().get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM reportes WHERE crew_member_id = ? AND estado = 'aprobado' ORDER BY aprobado_en DESC LIMIT 50",
  )
    .bind(c.var.crew.id)
    .all<FilaReporte>();
  const reportes = results.map(armar_respuesta);
  const { minutos, aceleracion } = leer_retraso(c.env);
  return c.json({
    enlace: { retraso_minutos: minutos, aceleracion, simulado: true },
    pendientes: reportes.filter((reporte) => reporte.transmision?.estado !== 'respondido').length,
    reportes,
  });
});
