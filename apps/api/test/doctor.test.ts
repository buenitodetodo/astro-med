import { env } from 'cloudflare:workers';
import { beforeAll, describe, expect, it } from 'vitest';
import app from '../src/index';
import { decidir, leer_ronda } from '../src/health/doctor';

type Json = Record<string, any>;
const call = async (crew: string, method: string, path: string, body?: unknown, overrides: Partial<Env> = {}) => {
  const res = await app.request(
    path,
    { method, headers: { 'X-Demo-Crew': crew, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined },
    { ...env, ...overrides },
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

const respuesta = (condicion_id: string, condicion: string, urgencia = 2) =>
  JSON.stringify({ condicion_id, condicion, urgencia, acciones: ['A', 'B', 'C'], que_no_hacer: ['X'], razon: 'R' });
const rondas = (cantidad: number, texto: string) => Array.from({ length: cantidad }, () => leer_ronda(texto));
const piedras = respuesta('piedras_rinon', 'Kidney stones');
const sans = respuesta('vision_sans', 'Vision changes');

describe('voting (Proposal A)', () => {
  it('9/10 and 8/10 on the same condition → high', () => {
    const r = decidir([...rondas(9, piedras), ...rondas(1, sans)], [...rondas(8, piedras), ...rondas(2, sans)])!;
    expect(r).toMatchObject({ nivel: 'alta', de_acuerdo: true, condicion: { nombre: 'Kidney stones (nephrolithiasis)' } });
  });
  it('7/10 and 10/10 → medium, with the second option', () => {
    const r = decidir([...rondas(7, piedras), ...rondas(3, sans)], rondas(10, piedras))!;
    expect(r.nivel).toBe('media');
    expect(r.segunda_opcion?.nombre).toBe('Vision changes (SANS / VIIP)');
  });
  it('5/10 → doubtful, and disagreement → doubtful', () => {
    expect(decidir([...rondas(5, piedras), ...rondas(5, sans)], rondas(10, piedras))!.nivel).toBe('dudosa');
    const desacuerdo = decidir(rondas(10, piedras), rondas(10, sans))!;
    expect(desacuerdo).toMatchObject({ nivel: 'dudosa', de_acuerdo: false, escalar_tierra: true });
  });
  it('groups out-of-catalog names written differently and always escalates them', () => {
    const fuera = (nombre: string) => respuesta('fuera_del_catalogo', nombre, 3);
    const r = decidir([...rondas(5, fuera('Acute appendicitis')), ...rondas(4, fuera('acute  appendicítis.'))], rondas(9, fuera('ACUTE APPENDICITIS')))!;
    expect(r).toMatchObject({ nivel: 'alta', sin_protocolo_validado: true, escalar_tierra: true, urgencia: 3, condicion: { en_catalogo: false, votos_razonamiento: 9 } });
  });
  it('counts rounds with a bad format against the vote', () => {
    const r = decidir([...rondas(7, piedras), leer_ronda('not json'), leer_ronda('{}'), leer_ronda('{"condicion_id":"made_up"}')], rondas(10, piedras))!;
    expect(r.nivel).toBe('media');
    expect(r.por_modelo.razonamiento.rondas_fallidas).toBe(3);
  });
  it('ignores the reasoning block of thinking models, even with braces inside', () => {
    const ronda = leer_ronda(`<think>Maybe {"condicion_id": "vision_sans"}? No, flank pain.</think>\n${piedras}`);
    expect(ronda.ok && ronda.respuesta.condicion_id).toBe('piedras_rinon');
  });
  it('says that one model did not answer instead of claiming a disagreement', () => {
    const caida = Array.from({ length: 10 }, () => ({ ok: false as const, error: 'LM Studio is unreachable', conexion: true }));
    const r = decidir(rondas(10, piedras), caida)!;
    expect(r).toMatchObject({ nivel: 'dudosa', escalar_tierra: true, condicion: { votos_razonamiento: 10, votos_medico: 0 } });
    expect(r.motivos_escalar).toContain('Only the reasoning model answered: the medical model could not be reached or gave no valid answer.');
    expect(r.motivos_escalar).not.toContain('The two models did not choose the same condition.');
    const al_reves = decidir(caida, rondas(10, piedras))!;
    expect(al_reves.motivos_escalar).toContain('Only the medical model answered: the reasoning model could not be reached or gave no valid answer.');
  });
  it('returns nothing when no round is valid', () => {
    expect(decidir(rondas(10, 'x'), rondas(10, 'x'))).toBeNull();
  });
});

const perfil = { nombre: 'Doc Test', edad: 40, sexo: 'hombre', peso_kg: 80, estatura_m: 1.8, tipo_sangre: 'A+', alergias: ['latex'] };

beforeAll(async () => {
  await env.DB.prepare(
    "INSERT OR IGNORE INTO crew_members (id, mission_id, callsign, role, is_demo) VALUES ('crew-doc', 'm-test', 'DT', 'tester', 1), ('crew-sin-perfil', 'm-test', 'NP', 'tester', 1), ('crew-ana', 'm-test', 'AL', 'tester', 1), ('crew-jose', 'm-test', 'JM', 'tester', 1)",
  ).run();
  for (const crew of ['crew-doc', 'crew-ana', 'crew-jose']) await call(crew, 'PUT', '/v1/profile', perfil);
  await call('crew-doc', 'GET', '/v1/doctor/models');
}, 30_000);

describe('AI doctor routes', () => {
  it('reports which configured models LM Studio has', async () => {
    const r = await call('crew-doc', 'GET', '/v1/doctor/models');
    expect(r.status).toBe(200);
    expect(r.body.configurados).toMatchObject({
      razonamiento: { id: 'microsoft/phi-4-reasoning-plus', servidor: 'razonamiento+chat', disponible: true },
      medico: { id: 'medgemma-4b-it', servidor: 'medico', conectado: true, disponible: false },
      chat: { id: 'google/gemma-3n-e4b', disponible: true },
    });
    expect(JSON.stringify(r.body)).not.toMatch(/laptop.test|localhost|https?:/);
  });

  it('checks a second LM Studio for the chat model when it lives on another machine', async () => {
    const laptop = { LMSTUDIO_CHAT_URL: 'http://laptop.test:1234/v1/' };
    const r = await call('crew-doc', 'GET', '/v1/doctor/models', undefined, laptop);
    expect(r.status).toBe(200);
    expect(r.body.servidores).toHaveLength(2);
    expect(r.body.configurados.chat).toMatchObject({ servidor: 'medico+chat', conectado: true, disponible: true });
    expect(r.body.configurados.razonamiento).toMatchObject({ servidor: 'razonamiento', disponible: true });

    const chat = await call('crew-doc', 'POST', '/v1/doctor/chat', { mensajes: [{ rol: 'user', texto: 'Hi' }] }, laptop);
    expect(chat.body.respuesta).toContain('Fake answer from google/gemma-3n-e4b on the laptop to: Hi');

    const apagada = await call('crew-doc', 'GET', '/v1/doctor/models', undefined, { LMSTUDIO_CHAT_URL: 'http://apagada.test:1234/v1' });
    expect(apagada.status).toBe(503);
    expect(apagada.body.configurados.chat).toMatchObject({ conectado: false, disponible: false });
    expect(apagada.body.configurados.razonamiento.conectado).toBe(true);
  });

  it('validates the case before starting the vote', async () => {
    expect((await call('crew-sin-perfil', 'POST', '/v1/doctor/case', { descripcion: 'x' })).status).toBe(404);
    expect((await call('crew-doc', 'POST', '/v1/doctor/case', {})).status).toBe(400);
  });

  it('only consults the doctor for a confirmed emergency, once', async () => {
    const sos = await call('crew-doc', 'POST', '/v1/emergency', { descripcion: 'Strong pain in the right flank going down to the groin' });
    expect((await call('crew-doc', 'POST', '/v1/doctor/case', { emergencia_id: sos.body.id })).status).toBe(409);
    await call('crew-doc', 'POST', `/v1/emergency/${sos.body.id}/cancel`);
    expect((await call('crew-doc', 'POST', '/v1/doctor/case', { emergencia_id: sos.body.id })).status).toBe(409);

    const real = await call('crew-doc', 'POST', '/v1/emergency', { descripcion: 'Strong pain in the right flank going down to the groin' });
    await env.DB.prepare('UPDATE emergencias SET vence_en = ? WHERE id = ?').bind(new Date(Date.now() - 1000).toISOString(), real.body.id).run();

    const caso = await call('crew-doc', 'POST', '/v1/doctor/case', { emergencia_id: real.body.id, sintomas: ['nausea'] });
    expect(caso.status).toBe(202);
    expect(caso.body).toMatchObject({ estado: 'en_proceso', progreso: { rondas_totales: 20 } });
    expect(caso.body.caso_texto).toContain('latex');
    expect(caso.body.caso_texto).toContain('right flank');

    const repetido = await call('crew-doc', 'POST', '/v1/doctor/case', { emergencia_id: real.body.id });
    expect(repetido.status).toBe(200);
    expect(repetido.body.id).toBe(caso.body.id);

    const listo = await esperar_caso('crew-doc', caso.body.id);
    expect(listo.body.estado).toBe('listo');
    expect(listo.body.progreso.rondas_hechas).toBe(20);
    expect(listo.body.resultado).toMatchObject({ nivel: 'alta', de_acuerdo: true, urgencia: 3, condicion: { nombre: 'Kidney stones (nephrolithiasis)', votos_razonamiento: 10, votos_medico: 10 } });
    expect(listo.body.resultado.escalar_tierra).toBe(true);

    const emergencia = await call('crew-doc', 'GET', `/v1/emergency/${real.body.id}`);
    expect(emergencia.body).toMatchObject({ doctor_ia: 'listo', caso_doctor_id: caso.body.id });

    const con_rondas = await call('crew-doc', 'GET', `/v1/doctor/case/${caso.body.id}?rondas=si`);
    expect(con_rondas.body.rondas.razonamiento).toHaveLength(10);
    expect(con_rondas.body.rondas.medico).toHaveLength(10);
    expect(con_rondas.body.rondas.medico.every((r: Json) => r.respuesta.razon === 'Test reason from the laptop')).toBe(true);
    expect(con_rondas.body.rondas.razonamiento.every((r: Json) => r.respuesta.razon === 'Test reason')).toBe(true);
    expect((await call('crew-sin-perfil', 'GET', `/v1/doctor/case/${caso.body.id}`)).status).toBe(404);
  });

  it('marks disagreement between the models as doubtful', async () => {
    const caso = await call('crew-doc', 'POST', '/v1/doctor/case', { descripcion: 'Headache and blurry vision [fake:split]' });
    const listo = await esperar_caso('crew-doc', caso.body.id);
    expect(listo.body.resultado).toMatchObject({ nivel: 'dudosa', de_acuerdo: false, escalar_tierra: true });
  });

  it('flags an out-of-catalog condition as having no validated protocol', async () => {
    const caso = await call('crew-doc', 'POST', '/v1/doctor/case', { descripcion: 'Pain in the lower right abdomen [fake:outside]' });
    const listo = await esperar_caso('crew-doc', caso.body.id);
    expect(listo.body.resultado).toMatchObject({ sin_protocolo_validado: true, condicion: { en_catalogo: false } });
  });

  it('ends in a clear error when LM Studio fails, without retrying every round', async () => {
    const caso = await call('crew-doc', 'POST', '/v1/doctor/case', { descripcion: 'Dizziness [fake:down]' });
    const listo = await esperar_caso('crew-doc', caso.body.id);
    expect(listo.body.estado).toBe('error');
    expect(listo.body.error).toContain('500');
    expect(listo.body.progreso.rondas_hechas).toBe(20);
    const con_rondas = await call('crew-doc', 'GET', `/v1/doctor/case/${caso.body.id}?rondas=si`);
    expect(con_rondas.body.rondas.razonamiento.every((r: Json) => r.ok === false && r.conexion === true)).toBe(true);
  });

  it('answers the assistant chat with the astronaut context', async () => {
    const r = await call('crew-doc', 'POST', '/v1/doctor/chat', { mensajes: [{ rol: 'user', texto: 'How did I sleep last night?' }] });
    expect(r.status).toBe(200);
    expect(r.body.respuesta).toContain('Fake answer from google/gemma-3n-e4b to: How did I sleep last night?');
    expect(r.body.respuesta).toContain('Reply in the same language as this message.');
    expect(r.body.modelo).toBe('google/gemma-3n-e4b');
    expect(r.body.etiqueta).toContain('not validated');
    expect(r.body.emergencia).toBeNull();
    const caida = await call('crew-doc', 'POST', '/v1/doctor/chat', { mensajes: [{ rol: 'user', texto: 'Hello [fake:down]' }] });
    expect(caida.status).toBe(503);
    expect((await call('crew-doc', 'POST', '/v1/doctor/chat', { mensajes: [{ rol: 'assistant', texto: 'Hi' }] })).status).toBe(400);
  });
});

describe('chat triggers the emergency (pitch scenarios)', () => {
  it('opens SOS when the crew explicitly asks for it in the chat', async () => {
    const r = await call('crew-ana', 'POST', '/v1/doctor/chat', {
      mensajes: [{ rol: 'user', texto: 'SOS! Ana cut her hand with a screwdriver, a 4 cm wound through the skin' }],
    });
    expect(r.status).toBe(200);
    expect(r.body.emergencia).toMatchObject({
      estado: 'en_verificacion',
      origen: 'tripulacion',
      reportada_por: 'ASTRO AI chat',
      segundos_restantes: 7,
    });
    expect(r.body.emergencia.descripcion).toContain('screwdriver');
    expect(r.body.emergencia.tarjeta.pasos.length).toBeGreaterThan(0);
    expect(r.body.respuesta).toContain('The app has already activated SOS');
  });

  it('opens SOS when the small model flags the message as an emergency, and hides the tag', async () => {
    const r = await call('crew-jose', 'POST', '/v1/doctor/chat', { mensajes: [{ rol: 'user', texto: 'Jose Maria passed out and is not answering [fake:flag]' }] });
    expect(r.status).toBe(200);
    expect(r.body.emergencia?.estado).toBe('en_verificacion');
    expect(r.body.respuesta).toBe('Apply firm pressure with a clean dressing.');
  });

  it('still opens SOS when the chat model is down', async () => {
    const r = await call('crew-ana', 'POST', '/v1/doctor/chat', { mensajes: [{ rol: 'user', texto: 'Emergency, please help [fake:down]' }] });
    expect(r.status).toBe(200);
    expect(r.body.emergencia).not.toBeNull();
    expect(r.body.modelo).toBeNull();
    expect(r.body.respuesta).toContain('Emergency activated');
  });

  it('votes a screwdriver cut as a skin laceration and returns its first-aid card, escalated to Earth', async () => {
    const caso = await call('crew-ana', 'POST', '/v1/doctor/case', { descripcion: 'Cut with a screwdriver, 4 cm, through the skin [fake:cut]', sintomas: ['bleeding'] });
    const listo = await esperar_caso('crew-ana', caso.body.id);
    expect(listo.body.resultado).toMatchObject({
      nivel: 'alta',
      condicion: { condicion_id: 'laceracion_piel', nombre: 'Skin laceration (cut)', en_catalogo: true },
      tarjeta: { titulo: 'Skin laceration: first aid', estado: 'provisional' },
      sin_protocolo_validado: true,
      escalar_tierra: true,
    });
    expect(listo.body.resultado.tarjeta.fuente).toContain('NHS');
    expect(listo.body.resultado.motivos_escalar.join(' ')).toContain('general first-aid protocol');
  });

  it('has a sourced card for fainting too', () => {
    const r = decidir(rondas(10, respuesta('sincope', 'Fainting', 3)), rondas(10, respuesta('sincope', 'Fainting', 3)))!;
    expect(r.tarjeta?.titulo).toBe('Fainting (syncope): first aid');
    expect(r.tarjeta?.fuente).toContain('nhs.uk/conditions/fainting');
  });
});
