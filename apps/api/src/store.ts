// D1 access. Every query is scoped by the authenticated crew member id — identity
// never comes from the request body.
import {
  METRICS, syncEventSchema, VITAL_METRICS,
  type AlertRow, type Metric, type ObservationRow, type SyncEvent, type VitalField,
} from '@astro-med/shared';

const DAY = 24 * 3600_000;
export const isoAgo = (days: number) => new Date(Date.now() - days * DAY).toISOString();

export const PROTOCOL_NOTICE = 'Follow the mission’s approved medical protocol and notify the flight surgeon.';

export type Applied = D1PreparedStatement[] | { rejected: string; status: 404 | 409 };

function alert(db: D1Database, crewId: string, triggerType: string, message: string, at: string) {
  return db
    .prepare("INSERT INTO health_alerts (id, crew_member_id, severity, trigger_type, message, created_at) VALUES (?, ?, 'warning', ?, ?, ?)")
    .bind(crypto.randomUUID(), crewId, triggerType, message, at);
}

/** Turn one validated event into idempotent statements, enforcing ownership. */
export async function apply(db: D1Database, crewId: string, e: SyncEvent): Promise<Applied> {
  const now = new Date().toISOString();
  switch (e.type) {
    case 'observation': {
      const p = e.payload;
      return [
        db
          .prepare(
            `INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(e.eventId, e.eventId, crewId, p.deviceId ?? null, p.metric, p.value, p.unit, p.source, p.quality, p.observedAt, now),
      ];
    }
    case 'symptom_report': {
      const p = e.payload;
      return [alert(db, crewId, 'symptom_self_report', `Symptom reported${p.note ? `: “${p.note}”` : ''}. ${PROTOCOL_NOTICE}`, p.reportedAt)];
    }
    case 'vitals': {
      const p = e.payload;
      return (Object.entries(VITAL_METRICS) as [VitalField, Metric][]).flatMap(([field, metric]) => {
        const value = p[field];
        if (value === undefined) return [];
        const id = `${e.eventId}:${metric}`;
        return [
          db
            .prepare(
              `INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ok', ?, ?)`,
            )
            .bind(id, id, crewId, p.deviceId ?? null, metric, value, METRICS[metric].unit, p.source, p.observedAt, now),
        ];
      });
    }
  }
}

export type IngestResult = 'accepted' | 'duplicate' | { rejected: string };

/**
 * Idempotent ingestion: the ledger row and the data are written in one D1 batch
 * (a transaction), so a retried event is either fully applied once or reported as duplicate.
 */
export async function ingest(db: D1Database, crewId: string, raw: unknown, ledger: Map<string, string>): Promise<IngestResult> {
  const parsed = syncEventSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { rejected: issue ? `${issue.path.join('.')}: ${issue.message}`.slice(0, 160) : 'invalid event' };
  }
  const e = parsed.data;
  const owner = ledger.get(e.eventId);
  if (owner) return owner === crewId ? 'duplicate' : { rejected: 'event id unavailable' };
  const stmts = await apply(db, crewId, e);
  if (!Array.isArray(stmts)) return { rejected: stmts.rejected };
  try {
    await db.batch([
      db.prepare('INSERT INTO sync_events (event_id, crew_member_id, event_type, created_at) VALUES (?, ?, ?, ?)').bind(e.eventId, crewId, e.type, new Date().toISOString()),
      ...stmts,
    ]);
  } catch (err) {
    // A concurrent retry won the race for the ledger row: nothing of ours was applied.
    if (String(err).includes('UNIQUE')) return 'duplicate';
    throw err;
  }
  ledger.set(e.eventId, crewId);
  return 'accepted';
}

export async function loadLedger(db: D1Database, eventIds: string[]): Promise<Map<string, string>> {
  if (!eventIds.length) return new Map();
  const { results } = await db
    .prepare(`SELECT event_id AS id, crew_member_id AS owner FROM sync_events WHERE event_id IN (${eventIds.map(() => '?').join(',')})`)
    .bind(...eventIds)
    .all<{ id: string; owner: string }>();
  return new Map(results.map((r) => [r.id, r.owner]));
}

const OBS_COLUMNS = 'event_id AS eventId, metric, value, unit, source, quality, observed_at AS observedAt';

export async function loadObservations(
  db: D1Database,
  crewId: string,
  q: { metric?: string; from: string; to: string; limit: number },
): Promise<ObservationRow[]> {
  const { results } = await db
    .prepare(
      `SELECT ${OBS_COLUMNS} FROM health_observations
       WHERE crew_member_id = ?1 AND observed_at >= ?2 AND observed_at < ?3 AND (?4 IS NULL OR metric = ?4)
       ORDER BY observed_at DESC LIMIT ?5`,
    )
    .bind(crewId, q.from, q.to, q.metric ?? null, q.limit)
    .all<ObservationRow>();
  return results;
}

export async function loadAlerts(db: D1Database, crewId: string): Promise<AlertRow[]> {
  const { results } = await db
    .prepare(
      'SELECT id, severity, trigger_type AS triggerType, message, status, created_at AS createdAt FROM health_alerts WHERE crew_member_id = ? ORDER BY created_at DESC LIMIT 50',
    )
    .bind(crewId)
    .all<AlertRow>();
  return results;
}

export async function deleteCrewData(db: D1Database, crewId: string) {
  await db.batch(
    ['reportes', 'casos_doctor', 'health_observations', 'health_alerts', 'sync_events', 'bitacora', 'comidas', 'emergencias'].map((t) =>
      db.prepare(`DELETE FROM ${t} WHERE crew_member_id = ?`).bind(crewId),
    ),
  );
}

const minutos_entre_lecturas_iguales = 15;

export function audit(db: D1Database, actorId: string, action: string, resource: string) {
  const ahora = new Date();
  if (action !== 'read') {
    return db.prepare('INSERT INTO audit_log (actor_id, action, resource, created_at) VALUES (?, ?, ?, ?)').bind(actorId, action, resource, ahora.toISOString()).run();
  }
  const desde = new Date(ahora.getTime() - minutos_entre_lecturas_iguales * 60_000).toISOString();
  return db
    .prepare(
      `INSERT INTO audit_log (actor_id, action, resource, created_at)
       SELECT ?1, 'read', ?2, ?3
       WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE actor_id = ?1 AND created_at > ?4 AND action = 'read' AND resource = ?2)`,
    )
    .bind(actorId, resource, ahora.toISOString(), desde)
    .run();
}
