import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import {
  DISCLAIMER, manualObservationSchema, METRICS, observationsQuerySchema, syncBatchSchema,
  type CrewProfile, type SyncResult,
} from '@astro-med/shared';
import { audit, deleteCrewData, ingest, isoAgo, loadAlerts, loadLedger, loadObservations } from './store';
import type { AppEnv, Crew } from './types';
import { validate } from './validate';
import { rutas_bitacora } from './routes/log';
import { rutas_comidas } from './routes/meals';
import { rutas_doctor } from './routes/doctor';
import { rutas_emergencia } from './routes/emergency';
import { rutas_estado } from './routes/status';
import { rutas_nutricion } from './routes/nutrition';
import { rutas_perfil } from './routes/profile';
import { rutas_cola, rutas_reportes } from './routes/reports';
import { rutas_signos } from './routes/vitals';
import { rutas_simulador } from './routes/simulator';

const app = new Hono<AppEnv>();

app.onError((err, c) => {
  // Never log request bodies or health values — only the error class and route.
  console.error('api_error', c.req.method, new URL(c.req.url).pathname, err instanceof Error ? err.name : 'error');
  const storage = /D1_|SQLITE_BUSY/.test(String(err));
  return c.json({ error: storage ? 'storage_unavailable' : 'internal_error' }, storage ? 503 : 500);
});

app.get('/v1/health', (c) => c.json({ ok: true, service: 'astro-med-api', demoMode: c.env.DEMO_MODE === 'true', time: new Date().toISOString() }));

/**
 * Identity. Only an explicit DEMO_MODE exists in this MVP: the caller picks one of the
 * seeded fictional crew members with X-Demo-Crew and the server verifies it against D1.
 * Without DEMO_MODE every data route answers 401 — a real deployment must put an approved
 * identity provider (e.g. Cloudflare Access / OIDC) here and derive the crew member from it.
 */
const auth = createMiddleware<AppEnv>(async (c, next) => {
  if (c.env.DEMO_MODE !== 'true') return c.json({ error: 'auth_not_configured', message: 'No identity provider is configured and demo mode is off.' }, 401);
  if (c.req.path.startsWith('/v1/sim/')) {
    const { success } = await c.env.API_LIMITER.limit({ key: 'simulator' });
    if (!success) return c.json({ error: 'rate_limited' }, 429, { 'Retry-After': '10' });
    return next();
  }
  const id = c.req.header('X-Demo-Crew');
  if (!id) return c.json({ error: 'unauthenticated' }, 401);
  const crew = await c.env.DB.prepare(
    `SELECT c.id, c.callsign, c.role, m.id AS missionId, m.name AS missionName, m.phase, m.started_at AS missionStart, m.duration_days AS durationDays
     FROM crew_members c JOIN missions m ON m.id = c.mission_id WHERE c.id = ? AND c.is_demo = 1`,
  )
    .bind(id)
    .first<Crew>();
  if (!crew) return c.json({ error: 'forbidden' }, 403);
  const { success } = await c.env.API_LIMITER.limit({ key: crew.id });
  if (!success) return c.json({ error: 'rate_limited' }, 429, { 'Retry-After': '10' });
  c.set('crew', crew);
  await next();
});
app.use('/v1/*', auth);

const profile = (c: Crew): CrewProfile => ({
  id: c.id,
  callsign: c.callsign,
  role: c.role,
  isDemo: true,
  mission: {
    id: c.missionId,
    name: c.missionName,
    phase: c.phase,
    day: Math.floor((Date.now() - Date.parse(c.missionStart.replace(' ', 'T') + 'Z')) / 86400_000) + 1,
    durationDays: c.durationDays,
  },
});

app.get('/v1/me', async (c) => {
  const crew = c.var.crew;
  // Demo only: the fictional roster, so the UI can switch profiles. Names and roles only, no health data.
  const { results } = await c.env.DB.prepare(
    `SELECT c.id, c.callsign, c.role, p.nombre AS name FROM crew_members c LEFT JOIN perfiles p ON p.crew_member_id = c.id
     WHERE c.mission_id = ? AND c.is_demo = 1 ORDER BY c.rowid`,
  )
    .bind(crew.missionId)
    .all();
  return c.json({ ...profile(crew), roles: ['crew_member'], demoCrew: results, disclaimer: DISCLAIMER });
});

app.route('/v1/profile', rutas_perfil);
app.route('/v1/log', rutas_bitacora);
app.route('/v1/meals', rutas_comidas);
app.route('/v1/vitals', rutas_signos);
app.route('/v1/nutrition', rutas_nutricion);
app.route('/v1/status', rutas_estado);
app.route('/v1/emergency', rutas_emergencia);
app.route('/v1/doctor', rutas_doctor);
app.route('/v1/reports', rutas_reportes);
app.route('/v1/queue', rutas_cola);
app.route('/v1/sim', rutas_simulador);

app.post('/v1/sync/batch', validate('json', syncBatchSchema), async (c) => {
  const { events } = c.req.valid('json');
  const db = c.env.DB;
  const ledger = await loadLedger(db, [...new Set(events.map((e) => e.eventId))]);
  const result: SyncResult = { accepted: [], duplicate: [], rejected: [] };
  for (const raw of events) {
    const r = await ingest(db, c.var.crew.id, raw, ledger);
    if (r === 'accepted') result.accepted.push(raw.eventId);
    else if (r === 'duplicate') result.duplicate.push(raw.eventId);
    else result.rejected.push({ eventId: raw.eventId, reason: r.rejected });
  }
  return c.json(result);
});

app.get('/v1/observations', validate('query', observationsQuerySchema), async (c) => {
  const q = c.req.valid('query');
  const from = q.from ?? isoAgo(30);
  const to = q.cursor ?? q.to ?? isoAgo(-1);
  if (Date.parse(to) - Date.parse(from) > 366 * 86400_000) return c.json({ error: 'invalid_request', message: 'time range is limited to 366 days' }, 400);
  const rows = await loadObservations(c.env.DB, c.var.crew.id, { metric: q.metric, from, to, limit: q.limit + 1 });
  const page = rows.slice(0, q.limit);
  await audit(c.env.DB, c.var.crew.id, 'read', 'observations');
  return c.json({ observations: page, nextCursor: rows.length > q.limit ? page.at(-1)!.observedAt : null });
});

app.post('/v1/observations/manual', validate('json', manualObservationSchema), async (c) => {
  const b = c.req.valid('json');
  const payload = { metric: b.metric, value: b.value, unit: METRICS[b.metric].unit, observedAt: b.observedAt ?? new Date().toISOString(), source: 'manual', quality: 'ok' };
  const r = await ingest(c.env.DB, c.var.crew.id, { eventId: b.eventId, type: 'observation', payload }, await loadLedger(c.env.DB, [b.eventId]));
  if (typeof r === 'object') return c.json({ error: 'invalid_request', message: r.rejected }, 400);
  return c.json({ eventId: b.eventId, result: r }, r === 'accepted' ? 201 : 200);
});

app.get('/v1/alerts', async (c) => c.json({ alerts: await loadAlerts(c.env.DB, c.var.crew.id) }));

/** "Delete my demo data": removes this crew member's observations, alerts and sync ledger. */
app.delete('/v1/me/data', async (c) => {
  await deleteCrewData(c.env.DB, c.var.crew.id);
  await audit(c.env.DB, c.var.crew.id, 'delete', 'all_own_data');
  return c.json({ deleted: true });
});

app.notFound((c) => c.json({ error: 'not_found' }, 404));

export { DoctorWorkflow } from './doctor_workflow';
export default app;
