// Local event log in IndexedDB: every write (observation, symptom report) is
// stored here first and doubles as the sync outbox.
// Not encrypted at rest: acceptable for fictional demo profiles, not for real health data.
import type { SyncEvent } from '@astro-med/shared';

export type LocalEvent = SyncEvent & {
  crewId: string;
  seq: number;
  createdAt: string;
  syncedAt: string | null;
  /** Server rejection reason; rejected events are kept for inspection but not retried. */
  rejected?: string;
};

const STORE = 'events';
let dbp: Promise<IDBDatabase> | undefined;

function open(): Promise<IDBDatabase> {
  return (dbp ??= new Promise((resolve, reject) => {
    const req = indexedDB.open('astro-med', 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'eventId' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T> {
  const tx = (await open()).transaction(STORE, mode);
  const req = fn(tx.objectStore(STORE));
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve((req ? req.result : undefined) as T);
    tx.onerror = tx.onabort = () => reject(tx.error);
  });
}

export const putEvents = (events: LocalEvent[]) => run<void>('readwrite', (s) => events.forEach((e) => void s.put(e)));

// ponytail: full scan + in-memory filter. Fine for a demo log of a few thousand events;
// add an index on crewId/syncedAt if the log is ever allowed to grow beyond that.
export async function allEvents(crewId?: string): Promise<LocalEvent[]> {
  const all = await run<LocalEvent[]>('readonly', (s) => s.getAll());
  return (crewId ? all.filter((e) => e.crewId === crewId) : all).sort((a, b) => a.seq - b.seq);
}

export const deleteEvents = (ids: string[]) => run<void>('readwrite', (s) => ids.forEach((id) => void s.delete(id)));
