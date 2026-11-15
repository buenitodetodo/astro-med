CREATE TABLE escenarios_sim (
  id TEXT PRIMARY KEY,
  crew_member_id TEXT NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
  plantilla TEXT NOT NULL,
  configuracion TEXT NOT NULL,
  dias_totales INTEGER NOT NULL,
  dia_inicio_cambios INTEGER,
  dia_evento INTEGER,
  fecha_base TEXT NOT NULL,
  dia_actual INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL CHECK (estado IN ('activo', 'terminado', 'reemplazado')),
  primer_aviso_dia INTEGER,
  avisos_antes_del_cambio INTEGER NOT NULL DEFAULT 0,
  caso_preventivo_id TEXT,
  caso_seguimiento_id TEXT,
  emergencia_id TEXT,
  caso_evento_id TEXT,
  historial TEXT NOT NULL DEFAULT '[]',
  creado_en TEXT NOT NULL
);
CREATE INDEX idx_escenarios_crew ON escenarios_sim (crew_member_id, creado_en);
