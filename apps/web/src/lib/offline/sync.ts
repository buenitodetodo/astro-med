// Outbox synchronisation: POST /v1/sync/batch with exponential backoff. The server is
// idempotent per eventId, so retrying after a lost response can never duplicate data.
import { MAX_BATCH, type SyncEvent, type SyncResult } from '@astro-med/shared';
import { api, ApiError, describeError, getCrewId } from '../api';
import { allEvents, deleteEvents, putEvents, type LocalEvent } from './db';

export interface SyncState {
  online: boolean;
  pending: number;
  syncing: boolean;
  /** Why the outbox is not draining, when it is not. */
  error: string | null;
  lastSyncedAt: string | null;
}

const RETENTION_MS = 30 * 24 * 3600_000;
let state: SyncState = { online: typeof navigator === 'undefined' ? true : navigator.onLine, pending: 0, syncing: false, error: null, lastSyncedAt: null };
const listeners = new Set<() => void>();
let attempt = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
let seq = Date.now();

const set = (patch: Partial<SyncState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};
export const getSyncState = () => state;
export const subscribeSync = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

const isPending = (e: LocalEvent) => !e.syncedAt && !e.rejected;

/** Store an event locally (always succeeds offline) and try to sync it. */
export async function record(event: SyncEvent): Promise<void> {
  await putEvents([{ ...event, crewId: getCrewId(), seq: ++seq, createdAt: new Date().toISOString(), syncedAt: null }]);
  set({ pending: state.pending + 1 });
  void flush();
}

export const newId = () => crypto.randomUUID();

export async function flush(): Promise<void> {
  if (state.syncing) return;
  clearTimeout(timer);
  set({ syncing: true });
  let error: string | null = null;
  let retryInMs = 0;
  try {
    const pending = (await allEvents()).filter(isPending);
    const byCrew = Map.groupBy(pending, (e) => e.crewId);
    for (const [crewId, events] of byCrew) {
      for (let i = 0; i < events.length; i += MAX_BATCH) {
        const chunk = events.slice(i, i + MAX_BATCH);
        const res = await api<SyncResult>('/v1/sync/batch', {
          method: 'POST',
          crewId,
          body: JSON.stringify({ events: chunk.map(({ eventId, type, payload }) => ({ eventId, type, payload })) }),
        });
        const done = new Set([...res.accepted, ...res.duplicate]);
        const rejected = new Map(res.rejected.map((r) => [r.eventId, r.reason]));
        const now = new Date().toISOString();
        await putEvents(chunk.map((e) => (done.has(e.eventId) ? { ...e, syncedAt: now } : rejected.has(e.eventId) ? { ...e, rejected: rejected.get(e.eventId) } : e)));
      }
    }
    attempt = 0;
    if (pending.length) set({ lastSyncedAt: new Date().toISOString() });
  } catch (e) {
    error = describeError(e);
    // Retry transient failures (offline, 429, 5xx) with backoff; auth/validation errors wait for the user.
    if (e instanceof ApiError && (e.offline || e.status === 429 || e.status >= 500))
      retryInMs = e.retryAfter ? e.retryAfter * 1000 : Math.min(60_000, 1000 * 2 ** attempt++);
  }
  const all = await allEvents().catch(() => []);
  // Retention: synced events older than 30 days are dropped from this device.
  const expired = all.filter((e) => e.syncedAt && Date.now() - Date.parse(e.createdAt) > RETENTION_MS).map((e) => e.eventId);
  if (expired.length) void deleteEvents(expired);
  set({ syncing: false, error, pending: all.filter(isPending).length });
  if (retryInMs) timer = setTimeout(() => void flush(), retryInMs);
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    attempt = 0;
    set({ online: true });
    void flush();
  });
  window.addEventListener('offline', () => set({ online: false }));
  void flush();
}
