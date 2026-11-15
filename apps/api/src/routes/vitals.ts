import { Hono } from 'hono';
import { z } from 'zod';
import { ingest, loadLedger } from '../store';
import type { AppEnv } from '../types';
import { validate } from '../validate';
import { cargar_lecturas, fecha_hace } from '../health/data';
import { signos_schema } from '../health/schemas';

export const rutas_signos = new Hono<AppEnv>()
  .post('/', validate('json', signos_schema), async (c) => {
    const { eventId, observedAt, ...valores } = c.req.valid('json');
    const payload = { ...valores, observedAt: observedAt ? new Date(observedAt).toISOString() : new Date().toISOString() };
    const resultado = await ingest(c.env.DB, c.var.crew.id, { eventId, type: 'vitals', payload }, await loadLedger(c.env.DB, [eventId]));
    if (typeof resultado === 'object') return c.json({ error: 'invalid_request', message: resultado.rejected }, 400);
    return c.json({ eventId, result: resultado }, resultado === 'accepted' ? 201 : 200);
  })
  .get('/', validate('query', z.object({ dias: z.coerce.number().int().min(1).max(366).default(30) })), async (c) => {
    const { dias } = c.req.valid('query');
    const lecturas = await cargar_lecturas(c.env.DB, c.var.crew.id, `${fecha_hace(dias - 1)}T00:00:00Z`);
    return c.json({ lecturas: lecturas.toReversed() });
  });
