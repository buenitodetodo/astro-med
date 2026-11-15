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

const uuid = () => crypto.randomUUID();
const ms_por_dia = 86_400_000;
const fecha = (dias_atras: number) => new Date(Date.now() - dias_atras * ms_por_dia).toISOString().slice(0, 10);
const momento = (dias_atras: number, hora = '08:00') => `${fecha(dias_atras)}T${hora}:00.000Z`;
const ahora = () => new Date().toISOString();
const color = (estado: Json, parametro: string) => estado.semaforo.find((s: Json) => s.parametro === parametro)?.color;

const ana = { nombre: 'Ana Prueba', edad: 38, sexo: 'mujer', peso_kg: 62, estatura_m: 1.68, tipo_sangre: 'O+', alergias: ['penicillin'] };
const luis = { nombre: 'Luis Prueba', edad: 40, sexo: 'hombre', peso_kg: 80, estatura_m: 1.8 };

beforeAll(async () => {
  await env.DB.prepare(
    "INSERT OR IGNORE INTO crew_members (id, mission_id, callsign, role, is_demo) VALUES ('crew-ana', 'm-test', 'AP', 'tester', 1), ('crew-luis', 'm-test', 'LP', 'tester', 1), ('crew-sana', 'm-test', 'SP', 'tester', 1)",
  ).run();
});

describe('profile', () => {
  it('answers profile_missing before the Earth data is saved', async () => {
    const r = await call('crew-ana', 'GET', '/v1/profile');
    expect(r.status).toBe(404);
    expect(r.body.error).toBe('profile_missing');
  });
  it('rejects ages below 19 because the energy equation is for adults', async () => {
    expect((await call('crew-ana', 'PUT', '/v1/profile', { ...ana, edad: 17 })).status).toBe(400);
  });
  it('saves the Earth profile and computes BMI in code', async () => {
    const r = await call('crew-ana', 'PUT', '/v1/profile', ana);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ nombre: 'Ana Prueba', imc: 22, tipo_sangre: 'O+', alergias: ['penicillin'], callsign: 'AP' });
    expect((await call('crew-ana', 'GET', '/v1/profile')).body.imc).toBe(22);
  });
});

describe('nutrition calculator (JSC-67378)', () => {
  it('gives the expected requirements for the example profile', async () => {
    const r = await call('crew-ana', 'GET', '/v1/nutrition');
    expect(r.status).toBe(200);
    expect(r.body.requerimientos).toMatchObject({
      factor_actividad: 1.25,
      energia_kcal: 2341,
      proteina_g: { minimo: 74.4, maximo: 111.6 },
      carbohidratos_g: { minimo: 263, maximo: 380 },
      grasas_g: { minimo: 52, maximo: 91 },
      liquidos_ml: 2100,
    });
  });
});

describe('meals', () => {
  it('logs a ration by code with the menu values and does not duplicate a retry', async () => {
    const id = uuid();
    const first = await call('crew-ana', 'POST', '/v1/meals', { id, codigo: 'ares-b2-019' });
    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({ codigo: 'ARES-B2-019', kcal: 620, proteina_g: 32 });
    const retry = await call('crew-ana', 'POST', '/v1/meals', { id, codigo: 'ARES-B2-019' });
    expect(retry.status).toBe(200);
    expect(retry.body.duplicado).toBe(true);
  });
  it('rejects unknown codes and meal ids owned by someone else', async () => {
    expect((await call('crew-ana', 'POST', '/v1/meals', { id: uuid(), codigo: 'NOPE-1' })).status).toBe(404);
    const id = uuid();
    await call('crew-ana', 'POST', '/v1/meals', { id, nombre: 'Soup', kcal: 300 });
    expect((await call('crew-luis', 'POST', '/v1/meals', { id, nombre: 'Soup', kcal: 300 })).status).toBe(409);
  });
  it('adds up today’s meals', async () => {
    await call('crew-ana', 'POST', '/v1/meals', { id: uuid(), nombre: 'Snack', kcal: 100, proteina_g: 5, liquidos_ml: 250 });
    const r = await call('crew-ana', 'GET', '/v1/meals');
    expect(r.body.totales.kcal).toBe(620 + 300 + 100);
    expect(r.body.comidas).toHaveLength(3);
  });
});

describe('daily log', () => {
  it('merges entries of the same day instead of replacing them', async () => {
    const first = await call('crew-ana', 'POST', '/v1/log', { fecha: fecha(0), sueno: { horas: 7.5 } });
    expect(first.status).toBe(201);
    const second = await call('crew-ana', 'POST', '/v1/log', { fecha: fecha(0), ejercicio: [{ equipo: 'ARED', minutos: 60 }] });
    expect(second.status).toBe(200);
    expect(second.body).toMatchObject({ sueno_horas: 7.5, ejercicio: [{ equipo: 'ARED', minutos: 60 }] });
  });
});

describe('vitals', () => {
  it('stores one reading as observations and does not duplicate a retry', async () => {
    const eventId = uuid();
    const lectura = { eventId, observedAt: ahora(), source: 'manual', pulso_lpm: 61, presion_sistolica: 110, presion_diastolica: 70, spo2: 98 };
    expect((await call('crew-ana', 'POST', '/v1/vitals', lectura)).status).toBe(201);
    const retry = await call('crew-ana', 'POST', '/v1/vitals', lectura);
    expect(retry.status).toBe(200);
    expect(retry.body.result).toBe('duplicate');
    const r = await call('crew-ana', 'GET', '/v1/vitals?dias=1');
    expect(r.body.lecturas[0]).toMatchObject({ pulso_lpm: 61, presion_sistolica: 110, presion_diastolica: 70, spo2: 98, fuente: 'manual' });
  });
  it('rejects half a blood pressure, empty readings and impossible values', async () => {
    expect((await call('crew-ana', 'POST', '/v1/vitals', { eventId: uuid(), source: 'manual', presion_sistolica: 110 })).status).toBe(400);
    expect((await call('crew-ana', 'POST', '/v1/vitals', { eventId: uuid(), source: 'manual' })).status).toBe(400);
    expect((await call('crew-ana', 'POST', '/v1/vitals', { eventId: uuid(), source: 'manual', spo2: 140 })).status).toBe(400);
  });
});

const sembrar_semana = async (crew: string, opciones: { kcal: number; sueno: number; minutos: number }) => {
  for (let dias = 6; dias >= 1; dias -= 1) {
    await call(crew, 'POST', '/v1/meals', { id: uuid(), nombre: 'Day total', kcal: opciones.kcal, proteina_g: 150, liquidos_ml: 3000, comido_en: momento(dias, '12:00') });
    await call(crew, 'POST', '/v1/log', { fecha: fecha(dias), sueno: { horas: opciones.sueno }, ejercicio: [{ equipo: 'ARED', minutos: opciones.minutos }] });
    await call(crew, 'POST', '/v1/vitals', {
      eventId: uuid(), observedAt: momento(dias), source: 'simulated',
      pulso_lpm: 55 + (dias % 3), hrv_ms: 60 + (dias % 3), temperatura_c: 36.6 + (dias % 3) * 0.1, spo2: 98,
    });
    await call(crew, 'POST', '/v1/observations/manual', { eventId: uuid(), metric: 'radiation_dose', value: 0.4, observedAt: momento(dias, '06:00') });
  }
};

describe('watcher (/v1/status)', () => {
  it('logs a repeated read once, not on every refresh, and still logs every write', async () => {
    await call('crew-luis', 'PUT', '/v1/profile', luis);
    await env.DB.prepare("DELETE FROM audit_log WHERE actor_id = 'crew-luis'").run();
    for (let vez = 0; vez < 4; vez += 1) await call('crew-luis', 'GET', '/v1/status');
    await call('crew-luis', 'GET', '/v1/profile');
    await call('crew-luis', 'GET', '/v1/profile');
    const lecturas = await env.DB.prepare("SELECT resource, COUNT(*) AS n FROM audit_log WHERE actor_id = 'crew-luis' AND action = 'read' GROUP BY resource ORDER BY resource").all<Json>();
    expect(lecturas.results).toEqual([{ resource: 'profile', n: 1 }, { resource: 'status', n: 1 }]);
    await call('crew-luis', 'DELETE', '/v1/me/data');
    await call('crew-luis', 'DELETE', '/v1/me/data');
    const borrados = await env.DB.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE actor_id = 'crew-luis' AND action = 'delete'").first<Json>();
    expect(borrados!.n).toBe(2);
  });

  it('turns bad simulated data into the expected alerts', async () => {
    await call('crew-luis', 'PUT', '/v1/profile', luis);
    await sembrar_semana('crew-luis', { kcal: 2000, sueno: 7, minutos: 20 });
    await call('crew-luis', 'POST', '/v1/log', { fecha: fecha(0), sueno: { horas: 5.5 }, caminata_espacial_horas: 1, ejercicio: [{ equipo: 'ARED', minutos: 20 }] });
    await call('crew-luis', 'POST', '/v1/vitals', { eventId: uuid(), observedAt: ahora(), source: 'simulated', pulso_lpm: 75, hrv_ms: 35, temperatura_c: 38.2, spo2: 92, presion_sistolica: 150, presion_diastolica: 95 });
    await call('crew-luis', 'POST', '/v1/observations/manual', { eventId: uuid(), metric: 'radiation_dose', value: 300, observedAt: ahora() });

    const r = await call('crew-luis', 'GET', '/v1/status');
    expect(r.status).toBe(200);
    expect(r.body.color_general).toBe('rojo');
    expect(color(r.body, 'ingesta')).toBe('rojo');
    expect(color(r.body, 'sueno')).toBe('rojo');
    expect(color(r.body, 'ritmo_cardiaco')).toBe('amarillo');
    expect(color(r.body, 'temperatura')).toBe('amarillo');
    expect(color(r.body, 'spo2')).toBe('amarillo');
    expect(color(r.body, 'musculo_hueso')).toBe('amarillo');
    expect(color(r.body, 'presion')).toBe('informativo');
    expect(color(r.body, 'radiacion')).toBe('rojo');
    const codigos = r.body.alertas.map((a: Json) => a.codigo);
    expect(codigos).toEqual(expect.arrayContaining(['deficit_calorias_seguido', 'sueno_corto_con_tarea_critica', 'pulso_sube', 'hrv_baja', 'temperatura_sube', 'spo2_baja', 'radiacion_tormenta_solar']));
    expect(r.body.alertas[0].gravedad).toBe('rojo');
    expect(r.body.alertas.every((a: Json) => typeof a.fuente === 'string' && a.fuente.length > 0)).toBe(true);
  });

  it('stays green with good simulated data', async () => {
    await call('crew-sana', 'PUT', '/v1/profile', ana);
    await sembrar_semana('crew-sana', { kcal: 2600, sueno: 7.5, minutos: 90 });
    await call('crew-sana', 'POST', '/v1/log', { fecha: fecha(0), sueno: { horas: 7.5 }, ejercicio: [{ equipo: 'T2', minutos: 30 }] });
    await call('crew-sana', 'POST', '/v1/vitals', { eventId: uuid(), observedAt: ahora(), source: 'simulated', pulso_lpm: 56, hrv_ms: 61, temperatura_c: 36.7, spo2: 98 });
    const r = await call('crew-sana', 'GET', '/v1/status');
    expect(r.body.total_alertas).toBe(0);
    expect(r.body.color_general).toBe('verde');
    for (const parametro of ['ingesta', 'sueno', 'ritmo_cardiaco', 'temperatura', 'spo2', 'musculo_hueso', 'radiacion']) expect(color(r.body, parametro)).toBe('verde');
  });

  it('does not judge today’s calories before the day is over', async () => {
    const r = await call('crew-ana', 'GET', '/v1/status');
    const ingesta = r.body.semaforo.find((s: Json) => s.parametro === 'ingesta');
    expect(ingesta.color).toBe('sin_datos');
    expect(ingesta.datos.hoy_kcal).toBe(1020);
  });
});

describe('emergency', () => {
  it('runs the SOS flow: generic card at once, 7 s window, cancel, confirm', async () => {
    const sos = await call('crew-ana', 'POST', '/v1/emergency', { descripcion: 'Strong chest pain' });
    expect(sos.status).toBe(201);
    expect(sos.body).toMatchObject({ estado: 'en_verificacion', segundos_restantes: 7, doctor_ia: 'en_espera' });
    expect(sos.body.tarjeta.pasos.length).toBeGreaterThan(0);
    expect(sos.body.datos_criticos).toMatchObject({ tipo_sangre: 'O+', alergias: ['penicillin'] });

    const again = await call('crew-ana', 'POST', '/v1/emergency', {});
    expect(again.status).toBe(200);
    expect(again.body.id).toBe(sos.body.id);

    expect((await call('crew-luis', 'GET', `/v1/emergency/${sos.body.id}`)).status).toBe(404);

    const cancelled = await call('crew-ana', 'POST', `/v1/emergency/${sos.body.id}/cancel`);
    expect(cancelled.body).toMatchObject({ estado: 'cancelada', doctor_ia: 'no_requerido' });

    const real = await call('crew-ana', 'POST', '/v1/emergency', { origen: 'tripulacion', reportada_por: 'Luis' });
    expect(real.status).toBe(201);
    await env.DB.prepare('UPDATE emergencias SET vence_en = ? WHERE id = ?').bind(new Date(Date.now() - 1000).toISOString(), real.body.id).run();
    const confirmed = await call('crew-ana', 'GET', `/v1/emergency/${real.body.id}`);
    expect(confirmed.body).toMatchObject({ estado: 'confirmada', doctor_ia: 'pendiente', segundos_restantes: 0 });
    expect((await call('crew-ana', 'POST', `/v1/emergency/${real.body.id}/cancel`)).status).toBe(409);
  });
});
