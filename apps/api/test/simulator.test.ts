import { env } from 'cloudflare:workers';
import { beforeAll, describe, expect, it } from 'vitest';
import app from '../src/index';

type Json = Record<string, any>;

const sim = async (method: string, path: string, body?: unknown) => {
  const res = await app.request(
    `/v1/sim${path}`,
    { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined },
    env,
  );
  return { status: res.status, body: (await res.json()) as Json };
};

const call = async (crew: string, method: string, path: string, body?: unknown) => {
  const res = await app.request(
    path,
    { method, headers: { 'X-Demo-Crew': crew, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined },
    env,
  );
  return { status: res.status, body: (await res.json()) as Json };
};

const esperar_casos = async (id: string) => {
  for (let intento = 0; intento < 200; intento += 1) {
    const r = await sim('GET', `/scenarios/${id}`);
    const casos = [r.body.preventivo, r.body.seguimiento, r.body.evento?.caso].filter(Boolean);
    if (casos.every((caso: Json) => caso.estado !== 'en_proceso')) return r.body;
    await new Promise((resolver) => setTimeout(resolver, 100));
  }
  throw new Error('the voting workflow did not finish in time');
};

const astronautas = {
  'crew-sim-1': { nombre: 'Sim One', edad: 38, sexo: 'mujer', peso_kg: 62, estatura_m: 1.66, tipo_sangre: 'O+', alergias: ['penicillin'] },
  'crew-sim-2': { nombre: 'Sim Two', edad: 51, sexo: 'hombre', peso_kg: 92, estatura_m: 1.86, tipo_sangre: 'B-' },
  'crew-sim-3': { nombre: 'Sim Three', edad: 29, sexo: 'hombre', peso_kg: 70, estatura_m: 1.74 },
  'crew-sim-4': { nombre: 'Sim Four', edad: 44, sexo: 'mujer', peso_kg: 58, estatura_m: 1.6 },
};

beforeAll(async () => {
  await env.DB.prepare(
    "INSERT OR IGNORE INTO crew_members (id, mission_id, callsign, role, is_demo) VALUES ('crew-sim-1', 'm-test', 'S1', 'tester', 1), ('crew-sim-2', 'm-test', 'S2', 'tester', 1), ('crew-sim-3', 'm-test', 'S3', 'tester', 1), ('crew-sim-4', 'm-test', 'S4', 'tester', 1)",
  ).run();
  for (const [crew, perfil] of Object.entries(astronautas)) await call(crew, 'PUT', '/v1/profile', perfil);
});

describe('simulator panel catalog', () => {
  it('works without the crew header and lists templates, fields and catalog conditions', async () => {
    const r = await sim('GET', '/templates');
    expect(r.status).toBe(200);
    expect(r.body.plantillas.map((p: Json) => p.id)).toEqual(
      expect.arrayContaining(['control_sano', 'infeccion_respiratoria', 'fatiga_y_desmayo', 'deshidratacion_rinon', 'gastroenteritis', 'laceracion']),
    );
    expect(r.body.campos).toContain('radiacion_msv');
    expect(r.body.condiciones.length).toBeGreaterThan(40);
  });

  it('describes each astronaut from their own body: requirements and baseline differ', async () => {
    const r = await sim('GET', '/crew');
    const uno = r.body.tripulacion.find((p: Json) => p.id === 'crew-sim-1');
    const dos = r.body.tripulacion.find((p: Json) => p.id === 'crew-sim-2');
    expect(uno).toMatchObject({ nombre: 'Sim One', sexo: 'mujer', alergias: ['penicillin'] });
    expect(dos.requerimientos.kcal).toBeGreaterThan(uno.requerimientos.kcal);
    expect(dos.requerimientos.liquidos_ml).toBeGreaterThan(uno.requerimientos.liquidos_ml);
    expect(uno.linea_base_sugerida).not.toEqual(dos.linea_base_sugerida);
  });

  it('is closed when demo mode is off', async () => {
    const res = await app.request('/v1/sim/templates', {}, { ...env, DEMO_MODE: 'false' });
    expect(res.status).toBe(401);
  });

  it('rejects unknown conditions, bad days and closed scenarios', async () => {
    expect((await sim('POST', '/scenarios', { crew_id: 'crew-sim-3', plantilla: 'gastroenteritis', condicion_prevencion: 'made_up' })).status).toBe(400);
    expect((await sim('POST', '/scenarios', { crew_id: 'crew-sim-3', plantilla: 'fatiga_y_desmayo', dia_inicio_cambios: 10, dia_evento: 9 })).status).toBe(400);
    expect((await sim('POST', '/scenarios', { crew_id: 'crew-sim-3', plantilla: 'nope' })).status).toBe(404);
    expect((await sim('POST', '/scenarios', { crew_id: 'crew-real', plantilla: 'control_sano' })).status).toBe(404);
  });
});

describe('scenarios', () => {
  it('healthy control: 14 days with no preventive case', async () => {
    const creado = await sim('POST', '/scenarios', { crew_id: 'crew-sim-1', plantilla: 'control_sano' });
    expect(creado.status).toBe(201);
    expect(creado.body.escenario).toMatchObject({ tipo: 'control', dia_actual: 0, dias_totales: 14, dia_inicio_cambios: null });
    const r = await sim('POST', `/scenarios/${creado.body.escenario.id}/advance`, { dias: 14 });
    expect(r.body.escenario).toMatchObject({ dia_actual: 14, estado: 'terminado' });
    expect(r.body.dias).toHaveLength(14);
    expect(r.body.dias.at(-1).fecha).toBe(new Date().toISOString().slice(0, 10));
    expect(r.body.preventivo).toBeNull();
    expect(r.body.deteccion.avisos_antes_del_cambio).toBe(0);
    expect((await sim('POST', `/scenarios/${creado.body.escenario.id}/advance`, { dias: 1 })).status).toBe(409);
  });

  it('respiratory infection: silent before the hidden day, detected after it, and the AI is never told the answer', async () => {
    const creado = await sim('POST', '/scenarios', { crew_id: 'crew-sim-2', plantilla: 'infeccion_respiratoria' });
    const id = creado.body.escenario.id;
    const antes = await sim('POST', `/scenarios/${id}/advance`, { dias: 8 });
    expect(antes.body.deteccion.primer_aviso_dia).toBeNull();
    expect(antes.body.preventivo).toBeNull();

    await sim('POST', `/scenarios/${id}/advance`, { dias: 6 });
    const final = await esperar_casos(id);
    expect(final.deteccion.primer_aviso_dia).toBeGreaterThanOrEqual(9);
    expect(final.deteccion.dias_tras_el_cambio).toBeLessThanOrEqual(3);
    expect(final.preventivo.estado).toBe('listo');
    expect(final.prevencion_final).toMatchObject({ estado: 'listo', acierto: 'si', resultado: { condicion: { condicion_id: 'infeccion_respiratoria' } } });
    if (final.seguimiento) expect(final.preventivo.acierto).not.toBe('si');

    const caso = await env.DB.prepare('SELECT caso_texto, descripcion FROM casos_doctor WHERE id = ?').bind(final.prevencion_final.id).first<Json>();
    for (const pista of ['infeccion_respiratoria', 'Respiratory', 'respiratory infection', 'scenario', 'simulat']) {
      expect(caso!.caso_texto).not.toContain(pista);
    }
    expect(caso!.caso_texto).toContain('dry cough');
    const fuentes = await env.DB.prepare('SELECT DISTINCT source FROM health_observations WHERE crew_member_id = ?').bind('crew-sim-2').all<Json>();
    expect(fuentes.results.map((fila) => fila.source)).toEqual(['simulated']);
  });

  it('sleep debt then fainting: prevention before the event and the event reaches the predetermined conclusion', async () => {
    const creado = await sim('POST', '/scenarios', { crew_id: 'crew-sim-3', plantilla: 'fatiga_y_desmayo' });
    const id = creado.body.escenario.id;
    expect(creado.body.escenario).toMatchObject({ tipo: 'gradual_y_evento', dia_inicio_cambios: 8, dia_evento: 14 });
    await sim('POST', `/scenarios/${id}/advance`, { dias: 14 });
    const final = await esperar_casos(id);
    expect(final.deteccion.dias_de_anticipacion).toBeGreaterThan(0);
    expect(final.prevencion_final.acierto).toBe('si');
    expect(final.evento.caso).toMatchObject({ estado: 'listo', acierto: 'si', resultado: { condicion: { condicion_id: 'sincope' } } });
    const emergencia = await call('crew-sim-3', 'GET', `/v1/emergency/${final.evento.emergencia_id}`);
    expect(emergencia.body).toMatchObject({ estado: 'confirmada', reportada_por: 'Crew report' });

    const casos = await call('crew-sim-3', 'GET', '/v1/doctor/cases');
    expect(casos.status).toBe(200);
    const preventivo = casos.body.casos.find((caso: Json) => caso.id === final.prevencion_final.id);
    expect(preventivo).toMatchObject({ tipo: 'preventivo', estado: 'listo', reporte_id: null, resultado: { condicion: 'Sleep disorder' } });
    expect(casos.body.casos.find((caso: Json) => caso.id === final.evento.caso.id)).toMatchObject({ tipo: 'emergencia', emergencia_id: final.evento.emergencia_id });
    const reporte = await call('crew-sim-3', 'POST', '/v1/reports', { caso_doctor_id: preventivo.id });
    expect(reporte.status).toBe(201);
    const borrador = await call('crew-sim-3', 'GET', '/v1/doctor/cases');
    expect(borrador.body.casos.find((caso: Json) => caso.id === preventivo.id).reporte_id).toBeNull();
    expect((await call('crew-sim-3', 'PATCH', `/v1/reports/${reporte.body.id}/approve`, {})).status).toBe(200);
    const despues = await call('crew-sim-3', 'GET', '/v1/doctor/cases');
    expect(despues.body.casos.find((caso: Json) => caso.id === preventivo.id).reporte_id).toBe(reporte.body.id);
  });

  it('sudden cut: nothing to predict, the crew report goes straight to the AI doctor', async () => {
    const creado = await sim('POST', '/scenarios', { crew_id: 'crew-sim-1', plantilla: 'laceracion', dia_evento: 6, dias_totales: 8 });
    const id = creado.body.escenario.id;
    expect(creado.body.escenario).toMatchObject({ tipo: 'repentino', dia_evento: 6, dia_inicio_cambios: null });
    await sim('POST', `/scenarios/${id}/advance`, { dias: 8 });
    const final = await esperar_casos(id);
    expect(final.preventivo).toBeNull();
    expect(final.historial).toHaveLength(8);
    expect(final.historial[5]).toMatchObject({ dia: 6, abiertos: ['evento'] });
    expect(final.evento.caso).toMatchObject({ acierto: 'si', resultado: { condicion: { condicion_id: 'laceracion_piel' } } });
    expect(final.dias[5].evento).toMatchObject({ sintomas: ['bleeding cut on the left palm', 'pain at the wound'] });
  });

  it('custom scenario on another astronaut: own baseline, own changes and own expected answer', async () => {
    const creado = await sim('POST', '/scenarios', {
      crew_id: 'crew-sim-2',
      plantilla: 'control_sano',
      titulo: 'Stomach bug after a food batch',
      dias_totales: 12,
      dia_inicio_cambios: 7,
      cambios: [
        { campo: 'kcal_factor', delta: -0.5, rampa: 2 },
        { campo: 'liquidos_ml', delta: -1000, rampa: 2 },
        { campo: 'temperatura_c', delta: 0.9, rampa: 2 },
        { campo: 'pulso_lpm', delta: 10, rampa: 2 },
      ],
      sintomas: { desde: 0, lista: ['nausea', 'diarrhea'] },
      condicion_prevencion: 'gastroenteritis',
      linea_base: { pulso_lpm: 70, temperatura_c: 36.9 },
    });
    expect(creado.status).toBe(201);
    expect(creado.body.escenario).toMatchObject({ personalizado: true, tipo: 'gradual', titulo: 'Stomach bug after a food batch' });
    expect(creado.body.linea_base).toMatchObject({ pulso_lpm: 70, temperatura_c: 36.9 });
    expect(creado.body.verdad.condicion_prevencion.id).toBe('gastroenteritis');

    const id = creado.body.escenario.id;
    await sim('POST', `/scenarios/${id}/advance`, { dias: 12 });
    const final = await esperar_casos(id);
    expect(Math.abs(final.dias[2].pulso_lpm - 70)).toBeLessThanOrEqual(3);
    expect(final.dias.at(-1).kcal).toBeLessThan(final.dias[0].kcal * 0.6);
    expect(final.deteccion.primer_aviso_dia).toBeGreaterThanOrEqual(7);
    expect(final.prevencion_final).toMatchObject({ acierto: 'si' });
  });

  it('starting a new scenario wipes that astronaut and replaces the old one', async () => {
    const primero = await sim('POST', '/scenarios', { crew_id: 'crew-sim-3', plantilla: 'control_sano' });
    await sim('POST', `/scenarios/${primero.body.escenario.id}/advance`, { dias: 3 });
    const segundo = await sim('POST', '/scenarios', { crew_id: 'crew-sim-3', plantilla: 'deshidratacion_rinon' });
    expect((await sim('GET', `/scenarios/${primero.body.escenario.id}`)).body.escenario.estado).toBe('reemplazado');
    const bitacora = await env.DB.prepare('SELECT COUNT(*) AS n FROM bitacora WHERE crew_member_id = ?').bind('crew-sim-3').first<Json>();
    expect(bitacora!.n).toBe(0);
    const crew = await sim('GET', '/crew');
    expect(crew.body.tripulacion.find((p: Json) => p.id === 'crew-sim-3').escenario_id).toBe(segundo.body.escenario.id);
  });

  it('the current scenario day is always today, so the crew app sees every new day', async () => {
    const dia = (atras: number) => new Date(Date.now() - atras * 86_400_000).toISOString().slice(0, 10);
    const creado = await sim('POST', '/scenarios', { crew_id: 'crew-sim-4', plantilla: 'laceracion', dias_totales: 7, dia_evento: 4 });
    const id = creado.body.escenario.id;

    const dos = await sim('POST', `/scenarios/${id}/advance`, { dias: 2 });
    expect(dos.body.dias.map((d: Json) => d.fecha)).toEqual([dia(1), dia(0)]);
    expect(dos.body.escenario.fecha_evento).toBe(dia(-2));
    const estado = await call('crew-sim-4', 'GET', '/v1/status');
    expect(estado.body.fecha_signos).toBe(dia(0));
    expect(estado.body.fecha_bitacora).toBe(dia(0));

    const tres = await sim('POST', `/scenarios/${id}/advance`, { dias: 1 });
    expect(tres.body.dias.map((d: Json) => d.fecha)).toEqual([dia(2), dia(1), dia(0)]);
    const bitacora = await call('crew-sim-4', 'GET', '/v1/log');
    expect(bitacora.body.dias.map((d: Json) => d.fecha).sort()).toEqual([dia(2), dia(1), dia(0)]);
    const comidas = await call('crew-sim-4', 'GET', '/v1/meals');
    expect(comidas.body.comidas).toHaveLength(3);
    const futuras = await env.DB.prepare('SELECT COUNT(*) AS n FROM health_observations WHERE crew_member_id = ? AND observed_at > ?')
      .bind('crew-sim-4', new Date().toISOString()).first<Json>();
    expect(futuras!.n).toBe(0);
  });
});

