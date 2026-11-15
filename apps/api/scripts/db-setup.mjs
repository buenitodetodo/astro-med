// Applies migrations and the fictional demo seed to the LOCAL D1 database. Idempotent.
// stdin is detached so wrangler never stops to ask for confirmation (it would stall `pnpm dev`).
// Usage: node scripts/db-setup.mjs [persist-dir]
import { spawnSync } from 'node:child_process';

const persist = process.argv[2] ? ['--persist-to', process.argv[2]] : [];
for (const args of [
  ['d1', 'migrations', 'apply', 'astro-med-db', '--local', ...persist],
  ['d1', 'execute', 'astro-med-db', '--local', '--file', 'seed/demo.sql', ...persist],
]) {
  const { status, stdout, stderr } = spawnSync('wrangler', args, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', shell: process.platform === 'win32' });
  if (status !== 0) {
    console.error(stdout, stderr);
    process.exit(status ?? 1);
  }
}
console.log(`db: local D1 migrated and demo-seeded${persist.length ? ` (${persist[1]})` : ''}`);
