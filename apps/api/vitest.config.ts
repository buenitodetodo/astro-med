import path from 'node:path';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

const respuesta_falsa = (condicion_id: string, condicion: string, urgencia: number, razon = 'Test reason') =>
  JSON.stringify({
    condicion_id,
    condicion,
    urgencia,
    acciones: ['Action one', 'Action two', 'Action three'],
    que_no_hacer: ['Do not do this'],
    razon,
  });

const contestar = (contenido: string) => Response.json({ choices: [{ message: { content: contenido } }] });

async function lmstudio_falso(request: Request) {
  const url = new URL(request.url);
  const es_laptop = url.hostname === 'laptop.test';
  if (url.hostname === 'apagada.test') return new Response('unreachable', { status: 502 });
  if (url.pathname.endsWith('/models'))
    return Response.json({ data: es_laptop ? [{ id: 'google/gemma-3n-e4b' }] : [{ id: 'microsoft/phi-4-reasoning-plus' }, { id: 'google/gemma-3n-e4b' }, { id: 'other-model' }] });
  if (!url.pathname.endsWith('/chat/completions')) return new Response('not found', { status: 404 });

  const cuerpo = (await request.json()) as { model: string; messages: { content: string }[]; response_format?: unknown };
  const texto = cuerpo.messages.map((mensaje) => mensaje.content).join('\n');
  const es_medico = cuerpo.model === 'medgemma-4b-it';
  const razon = es_laptop ? 'Test reason from the laptop' : 'Test reason';
  const pensamiento = cuerpo.model === 'microsoft/phi-4-reasoning-plus' ? '<think>The case mentions {"pain": "flank"}; let me weigh the options.</think>\n' : '';
  if (texto.includes('[fake:down]')) return new Response('model crashed', { status: 500 });
  if (!cuerpo.response_format && texto.includes('[fake:flag]')) return contestar('<think>serious injury</think>[EMERGENCY] Apply firm pressure with a clean dressing.');
  if (texto.includes('[fake:cut]')) return contestar(pensamiento + respuesta_falsa('laceracion_piel', 'Skin laceration', 2, razon));
  if (!cuerpo.response_format)
    return contestar(`<think>short thought</think>Fake answer from ${cuerpo.model}${es_laptop ? ' on the laptop' : ''} to: ${cuerpo.messages.at(-1)?.content ?? ''}`);
  if (texto.includes('[fake:split]')) return contestar(pensamiento + (es_medico ? respuesta_falsa('vision_sans', 'Vision changes', 2, razon) : respuesta_falsa('piedras_rinon', 'Kidney stones', 2, razon)));
  if (texto.includes('[fake:outside]')) return contestar(pensamiento + respuesta_falsa('fuera_del_catalogo', es_medico ? 'ACUTE APPENDICITIS' : 'Acute appendicitis.', 3, razon));
  const por_palabra: [RegExp, string, string][] = [
    [/fainted/i, 'sincope', 'Syncope'],
    [/screwdriver/i, 'laceracion_piel', 'Skin laceration'],
    [/dry cough/i, 'infeccion_respiratoria', 'Respiratory infection'],
    [/diarrhea/i, 'gastroenteritis', 'Gastroenteritis'],
    [/difficulty concentrating/i, 'trastorno_sueno', 'Sleep disorder'],
  ];
  const encontrada = por_palabra.find(([patron]) => patron.test(texto));
  if (encontrada) return contestar(pensamiento + respuesta_falsa(encontrada[1], encontrada[2], 2, razon));
  return contestar(pensamiento + '```json\n' + respuesta_falsa('piedras_rinon', 'Kidney stones', es_medico ? 3 : 2, razon) + '\n```');
}

export default defineConfig({
  plugins: [
    cloudflareTest(async () => ({
      wrangler: { configPath: './wrangler.jsonc' },
      miniflare: {
        bindings: {
          DEMO_MODE: 'true',
          LMSTUDIO_MEDICO_URL: 'http://laptop.test:1234/v1',
          // Test-only binding so the setup file can apply the real migrations.
          TEST_MIGRATIONS: await readD1Migrations(path.join(import.meta.dirname, 'migrations')),
        },
        outboundService: lmstudio_falso,
      },
    })),
  ],
  test: { setupFiles: ['./test/setup.ts'], fileParallelism: false, testTimeout: 15_000, hookTimeout: 20_000 },
});
