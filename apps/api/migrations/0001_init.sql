-- Astro-Med · initial schema. Timestamps are ISO 8601 UTC strings.

CREATE TABLE missions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phase TEXT NOT NULL,
  started_at TEXT NOT NULL,
  is_demo INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE crew_members (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES missions(id),
  callsign TEXT NOT NULL,
  role TEXT NOT NULL,
  is_demo INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE sensor_devices (
  id TEXT PRIMARY KEY,
  crew_member_id TEXT NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
  sensor_kind TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('simulated', 'paired', 'revoked'))
);

CREATE TABLE health_observations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  crew_member_id TEXT NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
  device_id TEXT,
  metric TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('ble', 'usb', 'equipment', 'manual', 'simulated')),
  quality TEXT NOT NULL CHECK (quality IN ('ok', 'low_confidence', 'stale', 'invalid')),
  observed_at TEXT NOT NULL,
  received_at TEXT NOT NULL
);
CREATE INDEX idx_observations_owner ON health_observations (crew_member_id, observed_at);
CREATE INDEX idx_observations_metric ON health_observations (crew_member_id, metric, observed_at);

CREATE TABLE health_alerts (
  id TEXT PRIMARY KEY,
  crew_member_id TEXT NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning')),
  trigger_type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged')),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_alerts_owner ON health_alerts (crew_member_id, created_at);

-- Who read or changed health data. Holds actions and resource ids only — never values or prompts.
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_audit_actor ON audit_log (actor_id, created_at);

-- Idempotency ledger for offline sync: one row per accepted client event.
CREATE TABLE sync_events (
  event_id TEXT PRIMARY KEY,
  crew_member_id TEXT NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  created_at TEXT NOT NULL
);
