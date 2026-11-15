-- FICTIONAL demo data. Every person, mission and value below is invented for demonstration.
-- All vitals and radiation doses are stored with source = 'simulated' so the UI never presents
-- them as authentic measurements. Meals use the fictional Ares IV menu (content/rations.json).
-- Pitch personas: Ana Lucía (flight engineer, healthy) and José María (mission specialist,
-- sleep debt and low intake for the last days). Idempotent: fixed ids + INSERT OR IGNORE.

DELETE FROM crew_members WHERE id IN ('crew-elena', 'crew-aiko');

INSERT OR IGNORE INTO missions (id, name, phase, started_at, is_demo, duration_days) VALUES
  ('mission-ares-iv', 'Ares IV', 'Mars Transfer Orbit', datetime('now', '-127 days'), 1, 687);

INSERT OR IGNORE INTO crew_members (id, mission_id, callsign, role, is_demo) VALUES
  ('crew-rafael', 'mission-ares-iv', 'RD', 'Pilot', 1),
  ('crew-jose', 'mission-ares-iv', 'JM', 'Mission Specialist', 1),
  ('crew-marcos', 'mission-ares-iv', 'MI', 'Commander', 1),
  ('crew-ana', 'mission-ares-iv', 'AL', 'Flight Engineer', 1),
  ('crew-daniel', 'mission-ares-iv', 'DO', 'Chief Medical Officer', 1),
  ('crew-sofia', 'mission-ares-iv', 'SL', 'Geologist', 1);

INSERT OR IGNORE INTO perfiles (crew_member_id, nombre, edad, sexo, peso_kg, estatura_m, porcentaje_grasa, masa_muscular_kg, tipo_sangre, alergias, antecedentes, actualizado_en) VALUES
  ('crew-rafael', 'Rafael Duarte', 35, 'hombre', 74, 1.78, 15, 35, 'O+', '[]', '[]', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  ('crew-jose', 'José María', 36, 'hombre', 78, 1.8, 17, 35.5, 'A+', '[]', '[]', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  ('crew-marcos', 'Marcos Ibarra', 48, 'hombre', 82, 1.83, 18, 37.5, 'B+', '[]', '["mild hypertension, controlled"]', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  ('crew-ana', 'Ana Lucía', 34, 'mujer', 63, 1.68, 22, 25.8, 'O+', '["penicillin"]', '[]', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  ('crew-daniel', 'Daniel Okafor', 44, 'hombre', 79, 1.8, 17, 36, 'O-', '["sulfonamides"]', '[]', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  ('crew-sofia', 'Sofía Lindqvist', 38, 'mujer', 64, 1.7, 23, 26.5, 'AB+', '[]', '[]', strftime('%Y-%m-%dT%H:%M:%SZ', 'now'));

INSERT OR IGNORE INTO sensor_devices (id, crew_member_id, sensor_kind, status)
  SELECT 'sim-hr-' || id, id, 'heart_rate', 'simulated' FROM crew_members WHERE mission_id = 'mission-ares-iv';

-- Daily log for today and the 13 previous days. José María slept about 5 h the last four nights.
-- Nobody has exercised yet today (the ARED session is pending).
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO bitacora (crew_member_id, fecha, sueno_horas, sueno_calidad, ejercicio, caminata_espacial_horas, animo, sintomas, actualizado_en)
SELECT 'crew-rafael', date('now', '-' || n || ' days'), 7 + ((n * 3 + 0) % 4) * 0.25, 4,
       CASE WHEN n = 0 THEN '[]' ELSE '[{"equipo":"ARED","minutos":' || (50 + ((n + 0) % 3) * 5) || '},{"equipo":"' || CASE (n + 0) % 2 WHEN 0 THEN 'T2' ELSE 'CEVIS' END || '","minutos":30}]' END,
       0, 4, '[]', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO bitacora (crew_member_id, fecha, sueno_horas, sueno_calidad, ejercicio, caminata_espacial_horas, animo, sintomas, actualizado_en)
SELECT 'crew-jose', date('now', '-' || n || ' days'), CASE WHEN n <= 3 THEN 5.0 + (n % 2) * 0.5 ELSE 7 + ((n * 3 + 1) % 4) * 0.25 END, CASE WHEN n <= 3 THEN 2 ELSE 4 END,
       CASE WHEN n = 0 THEN '[]' ELSE '[{"equipo":"ARED","minutos":' || (50 + ((n + 1) % 3) * 5) || '},{"equipo":"' || CASE (n + 1) % 2 WHEN 0 THEN 'T2' ELSE 'CEVIS' END || '","minutos":30}]' END,
       0, CASE WHEN n <= 3 THEN 2 ELSE 4 END, CASE WHEN n <= 1 THEN '["tiredness","trouble concentrating"]' ELSE '[]' END, strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO bitacora (crew_member_id, fecha, sueno_horas, sueno_calidad, ejercicio, caminata_espacial_horas, animo, sintomas, actualizado_en)
SELECT 'crew-marcos', date('now', '-' || n || ' days'), 6.75 + ((n * 3 + 2) % 4) * 0.25, 4,
       CASE WHEN n = 0 THEN '[]' ELSE '[{"equipo":"ARED","minutos":' || (50 + ((n + 2) % 3) * 5) || '},{"equipo":"' || CASE (n + 2) % 2 WHEN 0 THEN 'T2' ELSE 'CEVIS' END || '","minutos":30}]' END,
       0, 4, '[]', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO bitacora (crew_member_id, fecha, sueno_horas, sueno_calidad, ejercicio, caminata_espacial_horas, animo, sintomas, actualizado_en)
SELECT 'crew-ana', date('now', '-' || n || ' days'), 7.25 + ((n * 3 + 3) % 4) * 0.25, 4,
       CASE WHEN n = 0 THEN '[]' ELSE '[{"equipo":"ARED","minutos":' || (50 + ((n + 3) % 3) * 5) || '},{"equipo":"' || CASE (n + 3) % 2 WHEN 0 THEN 'T2' ELSE 'CEVIS' END || '","minutos":30}]' END,
       0, 4, '[]', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO bitacora (crew_member_id, fecha, sueno_horas, sueno_calidad, ejercicio, caminata_espacial_horas, animo, sintomas, actualizado_en)
SELECT 'crew-daniel', date('now', '-' || n || ' days'), 7 + ((n * 3 + 4) % 4) * 0.25, 4,
       CASE WHEN n = 0 THEN '[]' ELSE '[{"equipo":"ARED","minutos":' || (50 + ((n + 4) % 3) * 5) || '},{"equipo":"' || CASE (n + 4) % 2 WHEN 0 THEN 'T2' ELSE 'CEVIS' END || '","minutos":30}]' END,
       0, 4, '[]', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO bitacora (crew_member_id, fecha, sueno_horas, sueno_calidad, ejercicio, caminata_espacial_horas, animo, sintomas, actualizado_en)
SELECT 'crew-sofia', date('now', '-' || n || ' days'), 6.75 + ((n * 3 + 5) % 4) * 0.25, 4,
       CASE WHEN n = 0 THEN '[]' ELSE '[{"equipo":"ARED","minutos":' || (50 + ((n + 5) % 3) * 5) || '},{"equipo":"' || CASE (n + 5) % 2 WHEN 0 THEN 'T2' ELSE 'CEVIS' END || '","minutos":30}]' END,
       0, 4, '[]', strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
FROM d;

-- Meals from the fictional menu. Men also get the L3 ration. Today only breakfast and snack so far.
-- José María skipped most meals the last three days (calorie and fluid deficit).
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-rafael-' || n || '-1', 'crew-rafael', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT07:15:00Z', 'now', '-' || n || ' days'), 'ARES-B2-019', 'Scrambled eggs and tortilla', 620, 32, 58, 28, 300, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-rafael-' || n || '-2', 'crew-rafael', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT10:40:00Z', 'now', '-' || n || ' days'), 'ARES-S1-004', 'Nut and cranberry bar', 380, 12, 40, 19, 0, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-rafael-' || n || '-3', 'crew-rafael', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT11:30:00Z', 'now', '-' || n || ' days'), 'ARES-W0-001', 'Drinking water (500 ml)', 0, 0, 0, 0, 500, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-rafael-' || n || '-4', 'crew-rafael', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT13:00:00Z', 'now', '-' || n || ' days'), 'ARES-L1-015', 'Chicken and rice', 680, 42, 82, 18, 300, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-rafael-' || n || '-5', 'crew-rafael', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT15:30:00Z', 'now', '-' || n || ' days'), 'ARES-L3-042', 'Balanced ration Ares L-3', 720, 38, 90, 22, 350, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-rafael-' || n || '-6', 'crew-rafael', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT17:30:00Z', 'now', '-' || n || ' days'), 'ARES-S2-007', 'Protein shake', 240, 30, 18, 5, 350, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-rafael-' || n || '-7', 'crew-rafael', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT19:30:00Z', 'now', '-' || n || ' days'), 'ARES-D2-031', 'Beef stew with vegetables', 650, 40, 60, 26, 300, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-rafael-' || n || '-8', 'crew-rafael', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT21:00:00Z', 'now', '-' || n || ' days'), 'ARES-W0-001', 'Drinking water (500 ml)', 0, 0, 0, 0, 500, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-jose-' || n || '-1', 'crew-jose', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT07:15:00Z', 'now', '-' || n || ' days'), 'ARES-B2-019', 'Scrambled eggs and tortilla', 620, 32, 58, 28, 300, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-jose-' || n || '-2', 'crew-jose', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT10:40:00Z', 'now', '-' || n || ' days'), 'ARES-S1-004', 'Nut and cranberry bar', 380, 12, 40, 19, 0, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-jose-' || n || '-3', 'crew-jose', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT11:30:00Z', 'now', '-' || n || ' days'), 'ARES-W0-001', 'Drinking water (500 ml)', 0, 0, 0, 0, 500, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-jose-' || n || '-4', 'crew-jose', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT13:00:00Z', 'now', '-' || n || ' days'), 'ARES-L1-015', 'Chicken and rice', 680, 42, 82, 18, 300, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-jose-' || n || '-5', 'crew-jose', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT15:30:00Z', 'now', '-' || n || ' days'), 'ARES-L3-042', 'Balanced ration Ares L-3', 720, 38, 90, 22, 350, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d WHERE n > 3;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-jose-' || n || '-6', 'crew-jose', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT17:30:00Z', 'now', '-' || n || ' days'), 'ARES-S2-007', 'Protein shake', 240, 30, 18, 5, 350, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d WHERE n > 3;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-jose-' || n || '-7', 'crew-jose', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT19:30:00Z', 'now', '-' || n || ' days'), 'ARES-D2-031', 'Beef stew with vegetables', 650, 40, 60, 26, 300, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d WHERE n > 3;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-jose-' || n || '-8', 'crew-jose', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT21:00:00Z', 'now', '-' || n || ' days'), 'ARES-W0-001', 'Drinking water (500 ml)', 0, 0, 0, 0, 500, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d WHERE n > 3;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-marcos-' || n || '-1', 'crew-marcos', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT07:15:00Z', 'now', '-' || n || ' days'), 'ARES-B2-019', 'Scrambled eggs and tortilla', 620, 32, 58, 28, 300, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-marcos-' || n || '-2', 'crew-marcos', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT10:40:00Z', 'now', '-' || n || ' days'), 'ARES-S1-004', 'Nut and cranberry bar', 380, 12, 40, 19, 0, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-marcos-' || n || '-3', 'crew-marcos', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT11:30:00Z', 'now', '-' || n || ' days'), 'ARES-W0-001', 'Drinking water (500 ml)', 0, 0, 0, 0, 500, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-marcos-' || n || '-4', 'crew-marcos', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT13:00:00Z', 'now', '-' || n || ' days'), 'ARES-L1-015', 'Chicken and rice', 680, 42, 82, 18, 300, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-marcos-' || n || '-5', 'crew-marcos', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT15:30:00Z', 'now', '-' || n || ' days'), 'ARES-L3-042', 'Balanced ration Ares L-3', 720, 38, 90, 22, 350, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-marcos-' || n || '-6', 'crew-marcos', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT17:30:00Z', 'now', '-' || n || ' days'), 'ARES-S2-007', 'Protein shake', 240, 30, 18, 5, 350, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-marcos-' || n || '-7', 'crew-marcos', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT19:30:00Z', 'now', '-' || n || ' days'), 'ARES-D2-031', 'Beef stew with vegetables', 650, 40, 60, 26, 300, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-marcos-' || n || '-8', 'crew-marcos', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT21:00:00Z', 'now', '-' || n || ' days'), 'ARES-W0-001', 'Drinking water (500 ml)', 0, 0, 0, 0, 500, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-ana-' || n || '-1', 'crew-ana', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT07:15:00Z', 'now', '-' || n || ' days'), 'ARES-B2-019', 'Scrambled eggs and tortilla', 620, 32, 58, 28, 300, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-ana-' || n || '-2', 'crew-ana', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT10:40:00Z', 'now', '-' || n || ' days'), 'ARES-S1-004', 'Nut and cranberry bar', 380, 12, 40, 19, 0, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-ana-' || n || '-3', 'crew-ana', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT11:30:00Z', 'now', '-' || n || ' days'), 'ARES-W0-001', 'Drinking water (500 ml)', 0, 0, 0, 0, 500, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-ana-' || n || '-4', 'crew-ana', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT13:00:00Z', 'now', '-' || n || ' days'), 'ARES-L1-015', 'Chicken and rice', 680, 42, 82, 18, 300, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-ana-' || n || '-6', 'crew-ana', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT17:30:00Z', 'now', '-' || n || ' days'), 'ARES-S2-007', 'Protein shake', 240, 30, 18, 5, 350, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-ana-' || n || '-7', 'crew-ana', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT19:30:00Z', 'now', '-' || n || ' days'), 'ARES-D2-031', 'Beef stew with vegetables', 650, 40, 60, 26, 300, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-ana-' || n || '-8', 'crew-ana', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT21:00:00Z', 'now', '-' || n || ' days'), 'ARES-W0-001', 'Drinking water (500 ml)', 0, 0, 0, 0, 500, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-daniel-' || n || '-1', 'crew-daniel', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT07:15:00Z', 'now', '-' || n || ' days'), 'ARES-B2-019', 'Scrambled eggs and tortilla', 620, 32, 58, 28, 300, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-daniel-' || n || '-2', 'crew-daniel', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT10:40:00Z', 'now', '-' || n || ' days'), 'ARES-S1-004', 'Nut and cranberry bar', 380, 12, 40, 19, 0, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-daniel-' || n || '-3', 'crew-daniel', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT11:30:00Z', 'now', '-' || n || ' days'), 'ARES-W0-001', 'Drinking water (500 ml)', 0, 0, 0, 0, 500, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-daniel-' || n || '-4', 'crew-daniel', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT13:00:00Z', 'now', '-' || n || ' days'), 'ARES-L1-015', 'Chicken and rice', 680, 42, 82, 18, 300, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-daniel-' || n || '-5', 'crew-daniel', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT15:30:00Z', 'now', '-' || n || ' days'), 'ARES-L3-042', 'Balanced ration Ares L-3', 720, 38, 90, 22, 350, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-daniel-' || n || '-6', 'crew-daniel', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT17:30:00Z', 'now', '-' || n || ' days'), 'ARES-S2-007', 'Protein shake', 240, 30, 18, 5, 350, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-daniel-' || n || '-7', 'crew-daniel', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT19:30:00Z', 'now', '-' || n || ' days'), 'ARES-D2-031', 'Beef stew with vegetables', 650, 40, 60, 26, 300, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-daniel-' || n || '-8', 'crew-daniel', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT21:00:00Z', 'now', '-' || n || ' days'), 'ARES-W0-001', 'Drinking water (500 ml)', 0, 0, 0, 0, 500, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-sofia-' || n || '-1', 'crew-sofia', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT07:15:00Z', 'now', '-' || n || ' days'), 'ARES-B2-019', 'Scrambled eggs and tortilla', 620, 32, 58, 28, 300, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-sofia-' || n || '-2', 'crew-sofia', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT10:40:00Z', 'now', '-' || n || ' days'), 'ARES-S1-004', 'Nut and cranberry bar', 380, 12, 40, 19, 0, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-sofia-' || n || '-3', 'crew-sofia', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT11:30:00Z', 'now', '-' || n || ' days'), 'ARES-W0-001', 'Drinking water (500 ml)', 0, 0, 0, 0, 500, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-sofia-' || n || '-4', 'crew-sofia', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT13:00:00Z', 'now', '-' || n || ' days'), 'ARES-L1-015', 'Chicken and rice', 680, 42, 82, 18, 300, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-sofia-' || n || '-6', 'crew-sofia', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT17:30:00Z', 'now', '-' || n || ' days'), 'ARES-S2-007', 'Protein shake', 240, 30, 18, 5, 350, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-sofia-' || n || '-7', 'crew-sofia', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT19:30:00Z', 'now', '-' || n || ' days'), 'ARES-D2-031', 'Beef stew with vegetables', 650, 40, 60, 26, 300, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;
WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO comidas (id, crew_member_id, fecha, comido_en, codigo, nombre, kcal, proteina_g, carbohidratos_g, grasas_g, liquidos_ml, creado_en)
SELECT 'seed-meal-crew-sofia-' || n || '-8', 'crew-sofia', date('now', '-' || n || ' days'), strftime('%Y-%m-%dT21:00:00Z', 'now', '-' || n || ' days'), 'ARES-W0-001', 'Drinking water (500 ml)', 0, 0, 0, 0, 500, strftime('%Y-%m-%dT%H:%M:%SZ', 'now') FROM d;

-- Morning vitals at 08:00 UTC for today and the 13 previous days.
-- Today Sofía's heart rate is up and her variability is down (mild cardiac alert scenario).
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-rafael-' || n || '-heart_rate', 'seed-v-crew-rafael-' || n || '-heart_rate', 'crew-rafael', 'sim-hr-crew-rafael', 'heart_rate', 62 + ((n * 7 + 0) % 5) - 2, 'bpm', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-rafael-' || n || '-hrv_sdnn', 'seed-v-crew-rafael-' || n || '-hrv_sdnn', 'crew-rafael', 'sim-hr-crew-rafael', 'hrv_sdnn', 58 + ((n * 5 + 0) % 7) - 3, 'ms', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-rafael-' || n || '-bp_systolic', 'seed-v-crew-rafael-' || n || '-bp_systolic', 'crew-rafael', 'sim-hr-crew-rafael', 'bp_systolic', 112 + ((n * 3 + 0) % 5) - 2, 'mmHg', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-rafael-' || n || '-bp_diastolic', 'seed-v-crew-rafael-' || n || '-bp_diastolic', 'crew-rafael', 'sim-hr-crew-rafael', 'bp_diastolic', 72 + ((n + 0) % 5) - 2, 'mmHg', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-rafael-' || n || '-body_temperature', 'seed-v-crew-rafael-' || n || '-body_temperature', 'crew-rafael', 'sim-hr-crew-rafael', 'body_temperature', 36.6 + ((n * 2 + 0) % 3) * 0.1, '°C', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-rafael-' || n || '-spo2', 'seed-v-crew-rafael-' || n || '-spo2', 'crew-rafael', 'sim-hr-crew-rafael', 'spo2', 97 + ((n + 0) % 3), '%', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-jose-' || n || '-heart_rate', 'seed-v-crew-jose-' || n || '-heart_rate', 'crew-jose', 'sim-hr-crew-jose', 'heart_rate', 61 + ((n * 7 + 3) % 5) - 2, 'bpm', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-jose-' || n || '-hrv_sdnn', 'seed-v-crew-jose-' || n || '-hrv_sdnn', 'crew-jose', 'sim-hr-crew-jose', 'hrv_sdnn', 57 + ((n * 5 + 1) % 7) - 3, 'ms', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-jose-' || n || '-bp_systolic', 'seed-v-crew-jose-' || n || '-bp_systolic', 'crew-jose', 'sim-hr-crew-jose', 'bp_systolic', 112 + ((n * 3 + 1) % 5) - 2, 'mmHg', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-jose-' || n || '-bp_diastolic', 'seed-v-crew-jose-' || n || '-bp_diastolic', 'crew-jose', 'sim-hr-crew-jose', 'bp_diastolic', 72 + ((n + 1) % 5) - 2, 'mmHg', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-jose-' || n || '-body_temperature', 'seed-v-crew-jose-' || n || '-body_temperature', 'crew-jose', 'sim-hr-crew-jose', 'body_temperature', 36.6 + ((n * 2 + 1) % 3) * 0.1, '°C', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-jose-' || n || '-spo2', 'seed-v-crew-jose-' || n || '-spo2', 'crew-jose', 'sim-hr-crew-jose', 'spo2', 97 + ((n + 1) % 3), '%', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-marcos-' || n || '-heart_rate', 'seed-v-crew-marcos-' || n || '-heart_rate', 'crew-marcos', 'sim-hr-crew-marcos', 'heart_rate', 64 + ((n * 7 + 6) % 5) - 2, 'bpm', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-marcos-' || n || '-hrv_sdnn', 'seed-v-crew-marcos-' || n || '-hrv_sdnn', 'crew-marcos', 'sim-hr-crew-marcos', 'hrv_sdnn', 49 + ((n * 5 + 2) % 7) - 3, 'ms', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-marcos-' || n || '-bp_systolic', 'seed-v-crew-marcos-' || n || '-bp_systolic', 'crew-marcos', 'sim-hr-crew-marcos', 'bp_systolic', 112 + ((n * 3 + 2) % 5) - 2, 'mmHg', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-marcos-' || n || '-bp_diastolic', 'seed-v-crew-marcos-' || n || '-bp_diastolic', 'crew-marcos', 'sim-hr-crew-marcos', 'bp_diastolic', 72 + ((n + 2) % 5) - 2, 'mmHg', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-marcos-' || n || '-body_temperature', 'seed-v-crew-marcos-' || n || '-body_temperature', 'crew-marcos', 'sim-hr-crew-marcos', 'body_temperature', 36.6 + ((n * 2 + 2) % 3) * 0.1, '°C', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-marcos-' || n || '-spo2', 'seed-v-crew-marcos-' || n || '-spo2', 'crew-marcos', 'sim-hr-crew-marcos', 'spo2', 97 + ((n + 2) % 3), '%', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-ana-' || n || '-heart_rate', 'seed-v-crew-ana-' || n || '-heart_rate', 'crew-ana', 'sim-hr-crew-ana', 'heart_rate', 58 + ((n * 7 + 9) % 5) - 2, 'bpm', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-ana-' || n || '-hrv_sdnn', 'seed-v-crew-ana-' || n || '-hrv_sdnn', 'crew-ana', 'sim-hr-crew-ana', 'hrv_sdnn', 66 + ((n * 5 + 3) % 7) - 3, 'ms', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-ana-' || n || '-bp_systolic', 'seed-v-crew-ana-' || n || '-bp_systolic', 'crew-ana', 'sim-hr-crew-ana', 'bp_systolic', 112 + ((n * 3 + 3) % 5) - 2, 'mmHg', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-ana-' || n || '-bp_diastolic', 'seed-v-crew-ana-' || n || '-bp_diastolic', 'crew-ana', 'sim-hr-crew-ana', 'bp_diastolic', 72 + ((n + 3) % 5) - 2, 'mmHg', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-ana-' || n || '-body_temperature', 'seed-v-crew-ana-' || n || '-body_temperature', 'crew-ana', 'sim-hr-crew-ana', 'body_temperature', 36.6 + ((n * 2 + 3) % 3) * 0.1, '°C', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-ana-' || n || '-spo2', 'seed-v-crew-ana-' || n || '-spo2', 'crew-ana', 'sim-hr-crew-ana', 'spo2', 97 + ((n + 3) % 3), '%', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-daniel-' || n || '-heart_rate', 'seed-v-crew-daniel-' || n || '-heart_rate', 'crew-daniel', 'sim-hr-crew-daniel', 'heart_rate', 61 + ((n * 7 + 12) % 5) - 2, 'bpm', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-daniel-' || n || '-hrv_sdnn', 'seed-v-crew-daniel-' || n || '-hrv_sdnn', 'crew-daniel', 'sim-hr-crew-daniel', 'hrv_sdnn', 55 + ((n * 5 + 4) % 7) - 3, 'ms', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-daniel-' || n || '-bp_systolic', 'seed-v-crew-daniel-' || n || '-bp_systolic', 'crew-daniel', 'sim-hr-crew-daniel', 'bp_systolic', 112 + ((n * 3 + 4) % 5) - 2, 'mmHg', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-daniel-' || n || '-bp_diastolic', 'seed-v-crew-daniel-' || n || '-bp_diastolic', 'crew-daniel', 'sim-hr-crew-daniel', 'bp_diastolic', 72 + ((n + 4) % 5) - 2, 'mmHg', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-daniel-' || n || '-body_temperature', 'seed-v-crew-daniel-' || n || '-body_temperature', 'crew-daniel', 'sim-hr-crew-daniel', 'body_temperature', 36.6 + ((n * 2 + 4) % 3) * 0.1, '°C', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-daniel-' || n || '-spo2', 'seed-v-crew-daniel-' || n || '-spo2', 'crew-daniel', 'sim-hr-crew-daniel', 'spo2', 97 + ((n + 4) % 3), '%', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-sofia-' || n || '-heart_rate', 'seed-v-crew-sofia-' || n || '-heart_rate', 'crew-sofia', 'sim-hr-crew-sofia', 'heart_rate', CASE WHEN n = 0 THEN 76 ELSE 59 + ((n * 7 + 15) % 5) - 2 END, 'bpm', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-sofia-' || n || '-hrv_sdnn', 'seed-v-crew-sofia-' || n || '-hrv_sdnn', 'crew-sofia', 'sim-hr-crew-sofia', 'hrv_sdnn', CASE WHEN n = 0 THEN 36 ELSE 60 + ((n * 5 + 5) % 7) - 3 END, 'ms', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-sofia-' || n || '-bp_systolic', 'seed-v-crew-sofia-' || n || '-bp_systolic', 'crew-sofia', 'sim-hr-crew-sofia', 'bp_systolic', 112 + ((n * 3 + 5) % 5) - 2, 'mmHg', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-sofia-' || n || '-bp_diastolic', 'seed-v-crew-sofia-' || n || '-bp_diastolic', 'crew-sofia', 'sim-hr-crew-sofia', 'bp_diastolic', 72 + ((n + 5) % 5) - 2, 'mmHg', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-sofia-' || n || '-body_temperature', 'seed-v-crew-sofia-' || n || '-body_temperature', 'crew-sofia', 'sim-hr-crew-sofia', 'body_temperature', 36.6 + ((n * 2 + 5) % 3) * 0.1, '°C', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, device_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-v-crew-sofia-' || n || '-spo2', 'seed-v-crew-sofia-' || n || '-spo2', 'crew-sofia', 'sim-hr-crew-sofia', 'spo2', 97 + ((n + 5) % 3), '%', 'simulated', 'ok', strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT08:00:00Z', 'now', '-' || n || ' days') FROM d;

-- Daily radiation dose (simulated) for today and the 13 previous days.
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-rad-crew-rafael-' || n, 'seed-rad-crew-rafael-' || n, 'crew-rafael', 'radiation_dose', 0.38 + ((n * 7 + 0) % 9) * 0.01, 'mSv', 'simulated', 'ok', strftime('%Y-%m-%dT06:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT06:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-rad-crew-jose-' || n, 'seed-rad-crew-jose-' || n, 'crew-jose', 'radiation_dose', 0.38 + ((n * 7 + 1) % 9) * 0.01, 'mSv', 'simulated', 'ok', strftime('%Y-%m-%dT06:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT06:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-rad-crew-marcos-' || n, 'seed-rad-crew-marcos-' || n, 'crew-marcos', 'radiation_dose', 0.38 + ((n * 7 + 2) % 9) * 0.01, 'mSv', 'simulated', 'ok', strftime('%Y-%m-%dT06:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT06:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-rad-crew-ana-' || n, 'seed-rad-crew-ana-' || n, 'crew-ana', 'radiation_dose', 0.38 + ((n * 7 + 3) % 9) * 0.01, 'mSv', 'simulated', 'ok', strftime('%Y-%m-%dT06:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT06:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-rad-crew-daniel-' || n, 'seed-rad-crew-daniel-' || n, 'crew-daniel', 'radiation_dose', 0.38 + ((n * 7 + 4) % 9) * 0.01, 'mSv', 'simulated', 'ok', strftime('%Y-%m-%dT06:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT06:00:00Z', 'now', '-' || n || ' days') FROM d;
WITH RECURSIVE d(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM d WHERE n < 13)
INSERT OR IGNORE INTO health_observations (id, event_id, crew_member_id, metric, value, unit, source, quality, observed_at, received_at)
SELECT 'seed-rad-crew-sofia-' || n, 'seed-rad-crew-sofia-' || n, 'crew-sofia', 'radiation_dose', 0.38 + ((n * 7 + 5) % 9) * 0.01, 'mSv', 'simulated', 'ok', strftime('%Y-%m-%dT06:00:00Z', 'now', '-' || n || ' days'), strftime('%Y-%m-%dT06:00:00Z', 'now', '-' || n || ' days') FROM d;
