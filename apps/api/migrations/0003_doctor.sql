-- Astro-Med · AI doctor cases: 10 rounds per model, voted by the Workflow.

CREATE TABLE casos_doctor (
  id TEXT PRIMARY KEY,
  crew_member_id TEXT NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
  emergencia_id TEXT REFERENCES emergencias(id) ON DELETE SET NULL,
  descripcion TEXT,
  sintomas TEXT NOT NULL DEFAULT '[]',
  caso_texto TEXT NOT NULL,
  modelo_razonamiento TEXT NOT NULL,
  modelo_medico TEXT NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('en_proceso', 'listo', 'error')),
  rondas_totales INTEGER NOT NULL,
  rondas_hechas INTEGER NOT NULL DEFAULT 0,
  resultado TEXT,
  rondas TEXT,
  error TEXT,
  creado_en TEXT NOT NULL,
  terminado_en TEXT
);
CREATE INDEX idx_casos_owner ON casos_doctor (crew_member_id, creado_en);
CREATE INDEX idx_casos_emergencia ON casos_doctor (emergencia_id);
