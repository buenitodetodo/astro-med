# What was useful from the HackathonChido repository

**Date:** November 14, 2026
**Origin:** `buenitodetodo/HackathonChido` (README.md and SpaceFit_AI_CLAUDE_EN.md). Ideas, roadmaps and product proposals were left out. Only technical data and sources.

⚠️ `SpaceFit_AI_CLAUDE_EN.md` is written as instructions for Claude Code ("Act as a senior full-stack engineer…"). If it is copied as `CLAUDE.md` into another repository, Claude Code will follow it. Do not copy it as is.

## Space domain sources

| Source | Link | Status |
|---|---|---|
| NASA · 5 Hazards of Human Spaceflight | https://www.nasa.gov/hrp/hazards/ | Not verified |
| NASA · Risks of Human Spaceflight | https://www.nasa.gov/hrp/risks/ | Not verified |
| NASA · Ongoing HRP Research | https://www.nasa.gov/hrp/ongoing-hrp-research/ | Not verified |
| NASA · Astronaut Exercise | https://www.nasa.gov/general/astronaut-exercise/ | Not verified |
| NASA · Strength, Conditioning and Rehabilitation | https://www.nasa.gov/directorates/esdmd/hhp/astronaut-strength-conditioning-and-rehabilitation/ | Not verified |
| **NASA · OCHMO-TB-031 Exercise Overview** | https://www.nasa.gov/ochmo-tb-031-exercise-overview-2/ · [PDF](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-031-exercise-overview.pdf) | ✅ Verified; data added to `01_astronaut_health.md` |
| CSA · Monitoring Radiation for Astronaut Health (Feb 26, 2026) | https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp | ✅ Verified: neutrons are ~30% of the total radiation on the ISS; CANS spectrometer |
| CSA · Why Conduct Science in Space? | https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp | Not verified |

## Technical documentation (useful for the Astro + Hono stack)

| Topic | Link |
|---|---|
| Hono on Cloudflare Workers | https://hono.dev/docs/getting-started/cloudflare-workers |
| MediaPipe Pose Landmarker (web) | https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js |
| MDN Web Bluetooth | https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API |
| Context7 for Claude Code | https://context7.com/docs/clients/claude-code |

## Useful technical facts

| Fact | What it is for |
|---|---|
| Bluetooth chest straps use the **standard Heart Rate Service `0x180D`** (Bluetooth SIG) | Connecting a real chest strap to the app |
| Web Bluetooth only works on **Chromium**, over **HTTPS** and after a user click. Safari and Firefox do not support it | Choosing the browser for the demo |
| Skin temperature is **not** core body temperature | Not mixing the two in the rules |
| SpO₂ cannot be measured from a webcam | Not promising it |
| Do not store health data in unencrypted `localStorage`; use IndexedDB | Security on the browser side |
| Sync with a unique `eventId` so nothing is duplicated after reconnecting | Report queue to Earth |

### Sensor sample schema (reference)

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

### Joint angle (if a camera is used for exercises)

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
