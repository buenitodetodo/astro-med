# Lo útil del repo HackathonChido

**Fecha:** 14 de noviembre de 2026
**Origen:** `buenitodetodo/HackathonChido` (README.md y SpaceFit_AI_CLAUDE_EN.md). Se excluyeron ideas, roadmaps y propuestas de producto. Solo datos técnicos y fuentes.

⚠️ `SpaceFit_AI_CLAUDE_EN.md` está escrito como instrucciones para Claude Code ("Act as a senior full-stack engineer…"). Si se copia como `CLAUDE.md` en otro repo, Claude Code lo va a seguir. Además usa Cloudflare, no Railway. No copiarlo tal cual.

## Fuentes de dominio espacial

| Fuente | Link | Estado |
|---|---|---|
| NASA · 5 Hazards of Human Spaceflight | https://www.nasa.gov/hrp/hazards/ | Sin verificar |
| NASA · Risks of Human Spaceflight | https://www.nasa.gov/hrp/risks/ | Sin verificar |
| NASA · Ongoing HRP Research | https://www.nasa.gov/hrp/ongoing-hrp-research/ | Sin verificar |
| NASA · Astronaut Exercise | https://www.nasa.gov/general/astronaut-exercise/ | Sin verificar |
| NASA · Strength, Conditioning and Rehabilitation | https://www.nasa.gov/directorates/esdmd/hhp/astronaut-strength-conditioning-and-rehabilitation/ | Sin verificar |
| **NASA · OCHMO-TB-031 Exercise Overview** | https://www.nasa.gov/ochmo-tb-031-exercise-overview-2/ · [PDF](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-031-exercise-overview.pdf) | ✅ Verificado; datos agregados a `01_salud_astronautas.md` |
| CSA · Monitoring Radiation for Astronaut Health (26/02/2026) | https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp | ✅ Verificado: los neutrones son ~30% de la radiación total en la EEI; espectrómetro CANS |
| CSA · Why Conduct Science in Space? | https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp | Sin verificar |

## Documentación técnica (sirve para el stack Astro + Hono)

| Tema | Link |
|---|---|
| Hono | https://hono.dev/docs/getting-started/cloudflare-workers (para Railway usar la guía de Node.js de Hono) |
| MediaPipe Pose Landmarker (web) | https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js |
| MDN Web Bluetooth | https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API |
| Context7 para Claude Code | https://context7.com/docs/clients/claude-code |

## Datos técnicos útiles

| Dato | Para qué sirve |
|---|---|
| Las bandas de pecho Bluetooth usan el **Heart Rate Service estándar `0x180D`** (Bluetooth SIG) | Conectar una pechera real a la app |
| Web Bluetooth solo funciona en **Chromium**, con **HTTPS** y con un clic del usuario. Safari y Firefox no lo soportan | Elegir navegador para la demo |
| La temperatura de la piel **no es** la temperatura corporal central | No mezclar las dos en las reglas |
| La SpO₂ no se puede sacar de una webcam | No prometerlo |
| No guardar datos de salud en `localStorage` sin cifrar; usar IndexedDB | Seguridad del lado del navegador |
| Sincronización con `eventId` único para no duplicar al reconectar | Cola de reportes a la Tierra |

### Esquema de muestra de sensor (referencia)

```ts
export type SampleSource = 'ble' | 'usb' | 'equipment' | 'manual' | 'simulated';
export type SampleQuality = 'ok' | 'low_confidence' | 'stale' | 'invalid';
export interface SensorSample {
  eventId: string;
  crewMemberId: string;
  deviceId?: string;
  metric: 'heart_rate' | 'spo2' | 'skin_temperature' | 'cadence' | 'rpe' | 'sleep_hours' | 'radiation_dose';
  value: number;
  unit: string;
  observedAt: string;
  receivedAt: string;
  source: SampleSource;
  quality: SampleQuality;
}
```

### Ángulo de una articulación (si usan cámara para ejercicios)

```ts
export type Point2 = { x: number; y: number };
export function jointAngleDeg(a: Point2, b: Point2, c: Point2): number {
  const u = { x: a.x - b.x, y: a.y - b.y };
  const v = { x: c.x - b.x, y: c.y - b.y };
  const dot = u.x * v.x + u.y * v.y;
  const mag = Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y);
  if (mag < 1e-8) return NaN;
  return (Math.acos(Math.min(1, Math.max(-1, dot / mag))) * 180) / Math.PI;
}
```
