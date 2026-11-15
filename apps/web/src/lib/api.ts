// Same-origin API client. In demo mode the identity is one of the seeded fictional crew
// members, chosen in Settings; the server verifies it. (A crew id is not health data, so a
// plain preference store is fine for it — health data lives in IndexedDB.)
const CREW_KEY = 'astro-med.crew';
export const DEFAULT_CREW = 'crew-rafael';

export const pref = {
  get: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string | null) => {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      /* private mode: preferences simply do not persist */
    }
  },
};

export const getCrewId = () => pref.get(CREW_KEY) ?? DEFAULT_CREW;
export const setCrewId = (id: string) => pref.set(CREW_KEY, id);

export class ApiError extends Error {
  constructor(public status: number, public code: string, public retryAfter?: number) {
    super(code);
  }
  /** Status 0 = the network (or the API) is unreachable. */
  get offline() {
    return this.status === 0;
  }
}

export async function api<T>(path: string, init: RequestInit & { crewId?: string } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { 'X-Demo-Crew': init.crewId ?? getCrewId(), ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
    });
  } catch {
    throw new ApiError(0, 'offline');
  }
  // A proxy with no API behind it (dev server without the Worker) answers 5xx/HTML.
  const body = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok || body === null) throw new ApiError(res.status, body?.error ?? 'unavailable', Number(res.headers.get('Retry-After')) || undefined);
  return body;
}

export function describeError(e: unknown, detalle?: string): string {
  const con_codigo = (texto: string, codigo: string) => `${texto} (Code ${codigo}${detalle ? `-${detalle}` : ''})`;
  if (!(e instanceof ApiError)) return con_codigo('Something went wrong. Please try again.', 'APP-00');
  if (e.offline) return con_codigo('This is not available right now. Please try again in a moment.', 'NET-00');
  if (e.status >= 500) return con_codigo('This is not available right now. Please try again in a moment.', `SRV-${e.status}`);
  if (e.code === 'auth_not_configured') return con_codigo('This is not available right now.', 'AUTH-01');
  if (e.status === 429) return con_codigo('Too many requests. Please wait a moment and try again.', 'RATE-429');
  if (e.status === 401 || e.status === 403) return con_codigo('This profile is not available.', `AUTH-${e.status}`);
  return con_codigo('That could not be completed. Please try again.', `REQ-${e.status}`);
}
