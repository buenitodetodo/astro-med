-- Astro-Med · Earth profile, daily log, meals and emergencies. Timestamps are ISO 8601 UTC strings.

ALTER TABLE missions ADD COLUMN duration_days INTEGER;

CREATE TABLE perfiles (
  crew_member_id TEXT PRIMARY KEY REFERENCES crew_members(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  edad INTEGER NOT NULL,
  sexo TEXT NOT NULL CHECK (sexo IN ('hombre', 'mujer')),
  peso_kg REAL NOT NULL,
  estatura_m REAL NOT NULL,
  porcentaje_grasa REAL,
  masa_muscular_kg REAL,
  tipo_sangre TEXT,
  alergias TEXT NOT NULL DEFAULT '[]',
  antecedentes TEXT NOT NULL DEFAULT '[]',
  actualizado_en TEXT NOT NULL
);

CREATE TABLE bitacora (
  crew_member_id TEXT NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
  fecha TEXT NOT NULL,
  sueno_horas REAL,
  sueno_calidad INTEGER,
  ejercicio TEXT NOT NULL DEFAULT '[]',
  caminata_espacial_horas REAL NOT NULL DEFAULT 0,
  animo INTEGER,
  sintomas TEXT NOT NULL DEFAULT '[]',
  actualizado_en TEXT NOT NULL,
  PRIMARY KEY (crew_member_id, fecha)
);

CREATE TABLE comidas (
  id TEXT PRIMARY KEY,
  crew_member_id TEXT NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
  fecha TEXT NOT NULL,
  comido_en TEXT NOT NULL,
  codigo TEXT,
  nombre TEXT NOT NULL,
  kcal REAL NOT NULL DEFAULT 0,
  proteina_g REAL NOT NULL DEFAULT 0,
  carbohidratos_g REAL NOT NULL DEFAULT 0,
  grasas_g REAL NOT NULL DEFAULT 0,
  liquidos_ml REAL NOT NULL DEFAULT 0,
  creado_en TEXT NOT NULL
);
CREATE INDEX idx_comidas_dia ON comidas (crew_member_id, fecha);

CREATE TABLE emergencias (
  id TEXT PRIMARY KEY,
  crew_member_id TEXT NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
  origen TEXT NOT NULL CHECK (origen IN ('sos', 'tripulacion', 'vigilante')),
  reportada_por TEXT,
  descripcion TEXT,
  creada_en TEXT NOT NULL,
  vence_en TEXT NOT NULL,
  cancelada_en TEXT
);
CREATE INDEX idx_emergencias_owner ON emergencias (crew_member_id, creada_en);
