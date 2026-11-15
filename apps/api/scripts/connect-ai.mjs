import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const carpeta_api = fileURLToPath(new URL('..', import.meta.url));
const limpiar = (url) => url?.trim().replace(/\/+$/, '').replace(/\/v1$/, '');
const [pc, laptop] = process.argv.slice(2).filter((arg) => arg !== '--').map(limpiar);

if (!pc || !laptop) {
  console.error('Usage: pnpm --filter @astro-med/api connect-ai <pc-tunnel-url> <laptop-tunnel-url>');
  process.exit(1);
}

const configuracion = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
const variable = (nombre) => configuracion.match(new RegExp(`"${nombre}"\\s*:\\s*"([^"]*)"`))?.[1];
const esperados = [
  { donde: 'PC', url: pc, modelos: [variable('MODELO_RAZONAMIENTO'), variable('MODELO_CHAT')] },
  { donde: 'laptop', url: laptop, modelos: [variable('MODELO_MEDICO')] },
];

for (const { donde, url, modelos } of esperados) {
  let ids;
  try {
    const respuesta = await fetch(`${url}/v1/models`, { signal: AbortSignal.timeout(20_000) });
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    ids = (await respuesta.json()).data.map((modelo) => modelo.id);
  } catch (error) {
    console.error(`✗ The ${donde} tunnel does not answer (${url}): ${error.message}`);
    console.error('  Check that cloudflared is still open and that the LM Studio server is Running.');
    process.exit(1);
  }
  const faltan = modelos.filter((modelo) => !ids.includes(modelo));
  if (faltan.length > 0) {
    console.error(`✗ The ${donde} is missing these models: ${faltan.join(', ')}. LM Studio has: ${ids.join(', ')}`);
    process.exit(1);
  }
  console.log(`✓ ${donde}: ${modelos.join(', ')}`);
}

const resultado = spawnSync(
  'npx',
  [
    'wrangler', 'deploy',
    '--var', 'DEMO_MODE:true',
    '--var', 'ACELERACION_DEMO:60',
    '--var', `LMSTUDIO_URL:${pc}/v1`,
    '--var', `LMSTUDIO_MEDICO_URL:${laptop}/v1`,
  ],
  { cwd: carpeta_api, stdio: 'inherit', shell: process.platform === 'win32' },
);
if (resultado.status !== 0) process.exit(resultado.status ?? 1);
console.log('✓ API published and connected to the PC and the laptop.');
