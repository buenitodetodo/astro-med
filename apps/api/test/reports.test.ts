import { env } from 'cloudflare:workers';
import { beforeAll, describe, expect, it } from 'vitest';
import app from '../src/index';

type Json = Record<string, any>;
const call = async (crew: string, method: string, path: string, body?: unknown) => {
  const res = await app.request(
    path,
    { method, headers: { 'X-Demo-Crew': crew, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined },
    env,
  );
  return { status: res.status, body: (await res.json()) as Json };
};

const esperar_caso = async (crew: string, id: string) => {
  for (let intento = 0; intento < 150; intento += 1) {
    const r = await call(crew, 'GET', `/v1/doctor/case/${id}`);
    if (r.body.estado !== 'en_proceso') return r;
    await new Promise((resolver) => setTimeout(resolver, 100));
  }
  throw new Error('the voting workflow did not finish in time');
};

const vencer = (tabla: string, columna: string, id: string) =>
  env.DB.prepare(`UPDATE ${tabla} SET ${columna} = ? WHERE id = ?`).bind(new Date(Date.now() - 1000).toISOString(), id).run();

const perfil = { nombre: 'Ana Lucía', edad: 34, sexo: 'mujer', peso_kg: 63, estatura_m: 1.68, tipo_sangre: 'O+', alergias: ['penicillin'] };

beforeAll(async () => {
  await env.DB.prepare("INSERT OR IGNORE INTO crew_members (id, mission_id, callsign, role, is_demo) VALUES ('crew-rep', 'm-test', 'AL', 'Flight Engineer', 1), ('crew-otro', 'm-test', 'OT', 'tester', 1)").run();
  for (const crew of ['crew-rep', 'crew-otro']) await call(crew, 'PUT', '/v1/profile', perfil);
});

describe('reports to Earth', () => {
  it('builds the report of an emergency with the AI doctor vote, in code', async () => {
    const sos = await call('crew-rep', 'POST', '/v1/emergency', { origen: 'tripulacion', descripcion: 'Screwdriver cut, 4 cm, through the skin' });
    await vencer('emergencias', 'vence_en', sos.body.id);
    const caso = await call('crew-rep', 'POST', '/v1/doctor/case', { emergencia_id: sos.body.id, descripcion: 'Screwdriver cut [fake:cut]' });
    await esperar_caso('crew-rep', caso.body.id);

    const r = await call('crew-rep', 'POST', '/v1/reports', { emergencia_id: sos.body.id, notas: 'Bleeding controlled with pressure.' });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ estado: 'borrador', emergencia_id: sos.body.id, caso_doctor_id: caso.body.id, transmision: null });
    expect(r.body.titulo).toBe('Medical report: Skin laceration (cut) (high confidence)');
    expect(r.body.contenido.doctor.resultado.tarjeta.titulo).toBe('Skin laceration: first aid');
    for (const parte of ['Ana Lucía', 'penicillin', 'Screwdriver cut', 'Skin laceration', 'Card applied: Skin laceration: first aid', 'Bleeding controlled']) {
      expect(r.body.texto).toContain(parte);
    }
    expect(r.body.resumen_ia).toMatchObject({ modelo: 'google/gemma-3n-e4b' });
    expect(r.body.resumen_ia.etiqueta).toContain('not validated');
  });

  it('still builds the report when the AI summary is not available', async () => {
    const r = await call('crew-rep', 'POST', '/v1/reports', { notas: 'Routine check [fake:down]' });
    expect(r.status).toBe(201);
    expect(r.body.resumen_ia).toBeNull();
    expect(r.body.titulo).toContain('Health report');
  });

  it('sends the approved report through the queue with the simulated delay and a labeled simulated reply', async () => {
    const borrador = await call('crew-rep', 'POST', '/v1/reports', { notas: 'Queue test' });
    const aprobado = await call('crew-rep', 'PATCH', `/v1/reports/${borrador.body.id}/approve`, { aprobado_por: 'Marcos Ibarra' });
    expect(aprobado.status).toBe(200);
    expect(aprobado.body).toMatchObject({ estado: 'aprobado', aprobado_por: 'Marcos Ibarra', transmision: { estado: 'en_camino', retraso_minutos: 12, aceleracion: 1, respuesta: null } });
    expect(aprobado.body.transmision.segundos_para_llegar).toBeGreaterThan(700);

    const otra_vez = await call('crew-rep', 'PATCH', `/v1/reports/${borrador.body.id}/approve`, {});
    expect(otra_vez.body.aprobado_en).toBe(aprobado.body.aprobado_en);

    let cola = await call('crew-rep', 'GET', '/v1/queue');
    expect(cola.body.enlace).toMatchObject({ retraso_minutos: 12, simulado: true });
    expect(cola.body.reportes.some((r: Json) => r.id === borrador.body.id)).toBe(true);
    expect(cola.body.reportes.some((r: Json) => r.estado === 'borrador')).toBe(false);

    await vencer('reportes', 'llega_en', borrador.body.id);
    expect((await call('crew-rep', 'GET', `/v1/reports/${borrador.body.id}`)).body.transmision.estado).toBe('recibido');

    await vencer('reportes', 'respuesta_en', borrador.body.id);
    const respondido = (await call('crew-rep', 'GET', `/v1/reports/${borrador.body.id}`)).body.transmision;
    expect(respondido.estado).toBe('respondido');
    expect(respondido.respuesta).toContain('SIMULATED RESPONSE');
    expect(respondido.respuesta).toContain('not an actual NASA protocol');

    cola = await call('crew-rep', 'GET', '/v1/queue');
    expect(cola.body.reportes.find((r: Json) => r.id === borrador.body.id).transmision.estado).toBe('respondido');
  });

  it('keeps reports private to their crew member and validates references', async () => {
    const r = await call('crew-rep', 'POST', '/v1/reports', {});
    expect((await call('crew-otro', 'GET', `/v1/reports/${r.body.id}`)).status).toBe(404);
    expect((await call('crew-otro', 'PATCH', `/v1/reports/${r.body.id}/approve`, {})).status).toBe(404);
    expect((await call('crew-otro', 'GET', '/v1/queue')).body.reportes).toEqual([]);
    expect((await call('crew-rep', 'POST', '/v1/reports', { emergencia_id: crypto.randomUUID() })).status).toBe(404);
    expect((await call('crew-rep', 'POST', '/v1/reports', { caso_doctor_id: crypto.randomUUID() })).status).toBe(404);
  });
});
