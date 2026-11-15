import { applyD1Migrations, type D1Migration } from 'cloudflare:test';
import { env } from 'cloudflare:workers';

declare global {
  namespace Cloudflare {
    interface Env {
      TEST_MIGRATIONS: D1Migration[];
    }
  }
}

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
// Two fictional crew members on one fictional mission.
await env.DB.batch([
  env.DB.prepare("INSERT OR IGNORE INTO missions (id, name, phase, started_at, is_demo) VALUES ('m-test', 'Test mission', 'test', datetime('now', '-9 days'), 1)"),
  env.DB.prepare("INSERT OR IGNORE INTO crew_members (id, mission_id, callsign, role, is_demo) VALUES ('crew-a', 'm-test', 'ALFA', 'tester', 1), ('crew-b', 'm-test', 'BRAVO', 'tester', 1)"),
  // A non-demo member must never be selectable through the demo header.
  env.DB.prepare("INSERT OR IGNORE INTO crew_members (id, mission_id, callsign, role, is_demo) VALUES ('crew-real', 'm-test', 'REAL', 'tester', 0)"),
]);
