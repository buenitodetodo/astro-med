// Web Worker entry: serves the static Astro build and forwards /v1/* to the API Worker
// through a service binding, so the browser only ever talks to one origin (no CORS).
type Binding = { fetch(request: Request): Promise<Response> };

export default {
  fetch(request: Request, env: { ASSETS: Binding; API: Binding }) {
    const ruta = new URL(request.url).pathname;
    if (ruta.startsWith('/v1/sim/')) return Response.json({ error: 'not_found' }, { status: 404 });
    return ruta.startsWith('/v1/') ? env.API.fetch(request) : env.ASSETS.fetch(request);
  },
};
