// Read side of the local event log: fold events into the same shapes the API returns, so
// every screen can render from this device alone and merge in server data when online.
import type { ObservationRow } from '@astro-med/shared';
import { getCrewId } from '../api';
import { allEvents, type LocalEvent } from './db';

export const foldObservations = (events: LocalEvent[]): ObservationRow[] =>
  events.flatMap((e) => (e.type === 'observation' && !e.rejected ? [{ eventId: e.eventId, ...e.payload }] : [])).sort((a, b) => b.observedAt.localeCompare(a.observedAt));

export async function localData() {
  const events = await allEvents(getCrewId());
  return { observations: foldObservations(events) };
}

/** Server rows plus anything local the server has not (yet) returned; local wins while unsynced. */
export function mergeById<T>(remote: T[], local: T[], id: (x: T) => string, order: (x: T) => string): T[] {
  const map = new Map(remote.map((x) => [id(x), x]));
  for (const x of local) if (!map.has(id(x)) || (x as { pending?: boolean }).pending) map.set(id(x), x);
  return [...map.values()].sort((a, b) => order(b).localeCompare(order(a)));
}
