import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import app from '../src/index';

type Json = Record<string, any>;
const call = async (crew: string | null, method: string, path: string, body?: unknown, overrides: Partial<Env> = {}) => {
  const res = await app.request(
    path,
    {
      method,
      headers: { ...(crew ? { 'X-Demo-Crew': crew } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    },
    { ...env, ...overrides },
  );
  return { status: res.status, body: (await res.json()) as Json, headers: res.headers };
};

const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();
const obsEvent = (metric = 'heart_rate', value = 118, unit = 'bpm', source = 'simulated') => ({
  eventId: uuid(), type: 'observation', payload: { metric, value, unit, observedAt: now(), source, quality: 'ok' },
});
const count = async (table: string, where: string, ...args: string[]) =>
  (await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${where}`).bind(...args).first<{ n: number }>())!.n;

describe('identity', () => {
  it('serves the technical health check without identity or personal data', async () => {
    const r = await call(null, 'GET', '/v1/health');
    expect(r.status).toBe(200);
    expect(Object.keys(r.body).sort()).toEqual(['demoMode', 'ok', 'service', 'time']);
  });
  it('rejects missing, unknown and non-demo identities', async () => {
    expect((await call(null, 'GET', '/v1/me')).status).toBe(401);
    expect((await call('crew-nobody', 'GET', '/v1/me')).status).toBe(403);
    expect((await call('crew-real', 'GET', '/v1/me')).status).toBe(403);
  });
  it('never enables demo identities when DEMO_MODE is off', async () => {
    const r = await call('crew-a', 'GET', '/v1/alerts', undefined, { DEMO_MODE: 'false' });
    expect(r.status).toBe(401);
    expect(r.body.error).toBe('auth_not_configured');
  });
  it('returns the authenticated profile and mission', async () => {
    const r = await call('crew-a', 'GET', '/v1/me');
    expect(r.body).toMatchObject({ id: 'crew-a', callsign: 'ALFA', isDemo: true, mission: { id: 'm-test', day: 10 } });
  });
});

describe('POST /v1/sync/batch', () => {
  it('is idempotent: a retried batch creates no duplicate rows', async () => {
    const events = [obsEvent(), obsEvent('sleep_hours', 6.5, 'h', 'manual')];
    const first = await call('crew-a', 'POST', '/v1/sync/batch', { events });
    expect(first.body).toEqual({ accepted: events.map((e) => e.eventId), duplicate: [], rejected: [] });
    const retry = await call('crew-a', 'POST', '/v1/sync/batch', { events });
    expect(retry.body).toEqual({ accepted: [], duplicate: events.map((e) => e.eventId), rejected: [] });
    expect(await count('health_observations', 'event_id = ?', events[0]!.eventId)).toBe(1);
  });

  it('rejects invalid events individually and keeps the valid ones', async () => {
    const good = obsEvent();
    const badUnit = obsEvent('heart_rate', 120, 'mph');
    const outOfRange = obsEvent('spo2', 140, '%');
    const stale = { ...obsEvent(), payload: { ...obsEvent().payload, observedAt: '2001-01-01T00:00:00Z' } };
    const r = await call('crew-a', 'POST', '/v1/sync/batch', { events: [good, badUnit, outOfRange, stale, { eventId: uuid(), type: 'nope' }] });
    expect(r.status).toBe(200);
    expect(r.body.accepted).toEqual([good.eventId]);
    expect(r.body.rejected.map((x: Json) => x.eventId)).toEqual([badUnit.eventId, outOfRange.eventId, stale.eventId, expect.any(String)]);
    expect(await count('health_observations', 'event_id IN (?, ?)', badUnit.eventId, outOfRange.eventId)).toBe(0);
  });

  it('caps the batch size and requires well-formed event ids', async () => {
    expect((await call('crew-a', 'POST', '/v1/sync/batch', { events: Array.from({ length: 101 }, () => obsEvent()) })).status).toBe(400);
    expect((await call('crew-a', 'POST', '/v1/sync/batch', { events: [] })).status).toBe(400);
    expect((await call('crew-a', 'POST', '/v1/sync/batch', { events: [{ eventId: 'not-a-uuid', type: 'observation' }] })).status).toBe(400);
  });
});

describe('ownership', () => {
  it('stores records under the authenticated owner and never exposes them to another crew member', async () => {
    const obs = obsEvent('sleep_hours', 7.5, 'h', 'manual');
    await call('crew-a', 'POST', '/v1/sync/batch', { events: [obs] });
    const mine = (await call('crew-a', 'GET', '/v1/observations?metric=sleep_hours')).body.observations;
    expect(mine.some((o: Json) => o.eventId === obs.eventId)).toBe(true);
    expect((await call('crew-b', 'GET', '/v1/observations?metric=sleep_hours')).body.observations).toEqual([]);
    const replay = await call('crew-b', 'POST', '/v1/sync/batch', { events: [obs] });
    expect(replay.body.rejected).toHaveLength(1);
  });

  it('ignores any identity placed in the request body', async () => {
    const obs = obsEvent();
    await call('crew-a', 'POST', '/v1/sync/batch', { events: [{ ...obs, crewMemberId: 'crew-b', payload: { ...obs.payload, crewMemberId: 'crew-b' } }] });
    expect(await count('health_observations', 'event_id = ? AND crew_member_id = ?', obs.eventId, 'crew-a')).toBe(1);
  });
});

describe('observations and alerts', () => {
  it('validates manual self-reports and labels them manual', async () => {
    const eventId = uuid();
    expect((await call('crew-a', 'POST', '/v1/observations/manual', { eventId, metric: 'sleep_hours', value: 6 })).status).toBe(201);
    expect((await call('crew-a', 'POST', '/v1/observations/manual', { eventId, metric: 'sleep_hours', value: 6 })).status).toBe(200);
    expect((await call('crew-a', 'POST', '/v1/observations/manual', { eventId: uuid(), metric: 'sleep_hours', value: 42 })).status).toBe(400);
    const rows = (await call('crew-a', 'GET', '/v1/observations?metric=sleep_hours')).body.observations;
    expect(rows.find((o: Json) => o.eventId === eventId)).toMatchObject({ source: 'manual', unit: 'h', value: 6 });
  });

  it('paginates and bounds the time series', async () => {
    const events = Array.from({ length: 5 }, (_, i) => ({ ...obsEvent('radiation_dose', 1 + i, 'mSv'), payload: { ...obsEvent('radiation_dose', 1 + i, 'mSv').payload, observedAt: new Date(Date.now() - i * 60_000).toISOString() } }));
    await call('crew-a', 'POST', '/v1/sync/batch', { events });
    const page1 = (await call('crew-a', 'GET', '/v1/observations?metric=radiation_dose&limit=3')).body;
    expect(page1.observations.map((o: Json) => o.value)).toEqual([1, 2, 3]);
    const page2 = (await call('crew-a', 'GET', `/v1/observations?metric=radiation_dose&limit=3&cursor=${encodeURIComponent(page1.nextCursor)}`)).body;
    expect(page2.observations.map((o: Json) => o.value)).toEqual([4, 5]);
    expect(page2.nextCursor).toBeNull();
    expect((await call('crew-a', 'GET', '/v1/observations?limit=5000')).status).toBe(400);
    expect((await call('crew-a', 'GET', '/v1/observations?from=2020-01-01T00:00:00Z')).status).toBe(400);
  });

  it('turns a symptom self-report into an alert visible to the owner only', async () => {
    await call('crew-a', 'POST', '/v1/sync/batch', { events: [{ eventId: uuid(), type: 'symptom_report', payload: { note: 'dizzy', reportedAt: now() } }] });
    const alerts = (await call('crew-a', 'GET', '/v1/alerts')).body.alerts;
    expect(alerts.map((a: Json) => a.triggerType)).toContain('symptom_self_report');
    expect(alerts[0].message).toContain('approved medical protocol');
    expect((await call('crew-b', 'GET', '/v1/alerts')).body.alerts).toEqual([]);
  });
});

describe('DELETE /v1/me/data', () => {
  it('deletes only the caller’s data', async () => {
    const a = obsEvent();
    const b = obsEvent();
    await call('crew-a', 'POST', '/v1/sync/batch', { events: [a] });
    await call('crew-b', 'POST', '/v1/sync/batch', { events: [b] });
    expect((await call('crew-a', 'DELETE', '/v1/me/data')).body.deleted).toBe(true);
    expect(await count('health_observations', "crew_member_id = 'crew-a'")).toBe(0);
    expect(await count('health_observations', 'event_id = ?', b.eventId)).toBe(1);
  });
});
