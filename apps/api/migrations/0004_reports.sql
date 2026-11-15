-- Astro-Med · Reports to Earth: built by code, approved by the crew, sent through a queue with the
-- simulated communication delay.

CREATE TABLE reportes (
  id TEXT PRIMARY KEY,
  crew_member_id TEXT NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
  emergencia_id TEXT REFERENCES emergencias(id) ON DELETE SET NULL,
  caso_doctor_id TEXT REFERENCES casos_doctor(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  texto TEXT NOT NULL,
  resumen_ia TEXT,
  modelo_resumen TEXT,
  estado TEXT NOT NULL CHECK (estado IN ('borrador', 'aprobado')),
  creado_en TEXT NOT NULL,
  aprobado_en TEXT,
  aprobado_por TEXT,
  retraso_minutos REAL,
  aceleracion REAL,
  llega_en TEXT,
  respuesta_en TEXT
);
CREATE INDEX idx_reportes_owner ON reportes (crew_member_id, creado_en);
