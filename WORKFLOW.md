[WORKFLOW.md](https://github.com/user-attachments/files/34879931/WORKFLOW.md)
# Workflow — NASA Space Apps 2026

Stack: **Astro** (frontend) · **Hono** (backend) · **Railway** (deployment) · **LM Studio + Vulkan** (local AI)

## 1. Architecture

```
                    ┌──────────────────────────────────────────────┐
   ASTRONAUT        │                BACKEND (Hono)                │
 ┌────────────┐     │                                              │
 │ Logbook    │────▶│  ① Profile + baseline (Earth data)           │
 │ Vitals     │────▶│  ② WATCHDOG (code, always on)                │
 │ SOS button │──┐  │     rules + trends + thresholds with source  │
 └────────────┘  │  │  ③ Calculator (EER, dose, deficits)          │
                 │  └──────────────┬───────────────────────────────┘
                 │                 │ alert or SOS
                 │                 ▼
                 │      ┌─────────────────────┐   "Are you okay?"
                 └─────▶│ Generic first-aid   │   [Cancel] 7 s 
                        │ card                │
                        └─────────┬───────────┘
                                  ▼
             ┌──────────────── AI DOCTOR (local, no internet) ───────────────────┐
             │  Messenger (small model, laptop)  ──builds the case──┐            │
             │                                                      ▼            │
             │  Large model (gpt-oss 20B / Qwen)     ×10 rounds ─┐                │
             │  MedGemma 4B (second opinion)         ×10 rounds ─┤ voting         │
             │                                                   ▼                │
             │      Condition catalog → personalized card                         │
             │      Outside the catalog → "no validated protocol" → Earth         │
             └────────────────────────────────────┬───────────────────────────────┘
                                                  ▼
                       Report → crew approves → queue to Earth
```

## 2. API Contract (agree on it first; frontend and backend work in parallel)

| Method | Route | What it does |
|---|---|---|
| `POST` | `/perfil` | Earth data: age, sex, weight, height, BMI, body fat %, muscle mass, blood type, allergies, medical history |
| `GET` | `/perfil/:id` | Profile + baseline |
| `POST` | `/bitacora` | Daily entry: food (kcal, protein, fluids), sleep, exercise (equipment, minutes), mood, symptoms |
| `POST` | `/signos` | Pulse, heart rate variability, blood pressure, temperature, SpO₂, with `fuente` (real / manual / simulated) |
| `GET` | `/estado/:id` | Traffic light per parameter + recommendation of the day |
| `GET` | `/alertas/:id` | Active watchdog alerts |
| `POST` | `/emergencia` | SOS button → generic card + activates the AI doctor |
| `POST` | `/emergencia/:id/cancelar` | "I'm okay" within the 7 s window |
| `POST` | `/doctor/caso` | Sends the case to the models and returns the voting result |
| `POST` | `/reporte` | Generates the report for Earth |
| `PATCH` | `/reporte/:id/aprobar` | The crew approves it → it enters the queue |
| `GET` | `/cola` | Reports pending to be sent |

## 3. Watchdog Rules (with sources; details in `research/01_astronaut_health.md`)

| Parameter | Rule | Source |
|---|---|---|
| Intake | EER (JSC-67378 equation) against the logbook; alert if there is a deficit for several days in a row | JSC-67378 |
| Protein / fluids | 1.2-1.8 g/kg/day; 32 ml/kg/day | JSC-67378 |
| Heart rhythm | Follow the **variability trend**; a resting pulse that **rises** in flight is abnormal | Xu 2013, Norsk 2015 |
| Radiation | Accumulated dose against the 600 mSv career limit; solar storm → shelter | OCHMO Standards |
| Sleep | Alert at ≤6 h before a critical task; accumulated debt | Jones 2022 |
| Temperature | Threshold **relative to the in-flight baseline**, not a fixed 37.5 °C | Stahn 2017 |
| Blood pressure | Slightly lower is normal; weeks before returning, remind about fluids and compression garments | Norsk 2015, Lee 2020 |
| Muscle / bone | Risk with predictors + loss of 1-2%/month; limits: aerobic and strength ≥80%, bone ≥95% | OCHMO-TB-030, TB-031 |
| CO₂ | 7-day average <2.5 mmHg | OCHMO-TB-004 |
| Exams | Reminders based on the official calendar (eyes at L+30, L+90…) | OCHMO-TB-043 |

**Golden rule:** the numbers are calculated by the code, never by the AI.

## 4. Parallel Work Teams

```
            13:00 ───────────────────────────────────────────────────▶ delivery
BACKEND     │ Base API │ watchdog + calculator   │ emergency + queue │ testing
(Dante +    │          │                         │                   │
Claude Code)│          │                         │                   │
FRONTEND    │ screens  │ logbook + traffic light │ SOS + cards       │ polish
(Astro)     │ with fake│                         │                   │
            │ data     │                         │                   │
AI          │ LM Studio│ prompt + voting         │ connect to /doctor│ test cases
            │ models   │ (fixed JSON format)     │                   │
CONTENT     │ PDFs to  │ condition cards         │ simulated profiles│ demo script
            │ text     │ (with source)           │ + mission         │
```

| Team | Minimum deliverable (the first thing that must work) |
|---|---|
| Backend | `/perfil`, `/bitacora`, `/signos`, `/estado` working on Railway |
| Frontend | Logbook + status screen with traffic light, connected to the API |
| AI | A case goes in → the 2 models vote → JSON comes out with condition, urgency and actions |
| Content | 10 condition cards with source + 2 simulated astronauts + mission document |

## 5. Steps with Claude Code (backend)

| # | Step | Done when… | Version |
|---|---|---|---|
| 1 | Create the Hono project with TypeScript and the empty routes from the contract | `GET /` responds locally | — |
| 2 | Profile + logbook + vitals with validation and storage (SQLite or Railway Postgres) | They are saved and read back | **V1** |
| 3 | Calculator (EER, protein, fluids, accumulated deficit) | A test with a sample profile gives the expected number | — |
| 4 | Watchdog: rules from section 3 → `/estado` and `/alertas` | Bad simulated data triggers an alert | **V2** |
| 5 | Emergency: SOS, generic card, cancellation window (now 7 s) | The full flow works without AI | **V3** |
| 6 | Connection to LM Studio (local OpenAI-compatible API) + 10-round voting | A case returns a voted result | **V4** |
| 7 | Report + approval + queue | The approved report appears in `/cola` | **V5** |
| 8 | Deployment on Railway + private tunnel (Tailscale) to the PC with the models | The online frontend reaches the local AI | **V6** |

Each version that works was saved in the private working repository before the next big change. If a change broke something and they get stuck in an error loop, they go back to the last good version.

## 6. First Message for Claude Code

> Read `WORKFLOW.md` and `research/01_astronaut_health.md`. We are going to build the backend in Hono with TypeScript, deployed on Railway. Start with steps 1 and 2 of section 5, using the routes from section 2. Rules: no comments in the code; natural variable names; no health threshold that is not in `research/01_astronaut_health.md`; numerical calculations go in code, not in the AI. When something works, tell me so I can save it as a version.

## 7. Demo Script (for recording)

1. Astronaut profile (Earth data) → the system calculates their baseline.
2. A week of simulated logbook entries → the traffic light changes (food deficit, poor sleep).
3. Recommendation of the day with visible source.
4. Emergency: SOS button → generic card at second 1 → AI doctor → personalized card.
5. **The internet cable is unplugged in front of the camera** → everything keeps working.
6. Report → the crew approves it → it sits in the queue to Earth.

## 8. Pending Decisions

| Decision | Options | Blocks |
|---|---|---|
| Voting confidence thresholds | Proposal A: ≥8/10 and both models agree = high; 6-7 = medium; ≤5 = Earth. Proposal B (Dante): 6/10 = high; 5/10 = crew's judgment | Step 6 |
| First-aid kit and crew medical level | Define in the simulated mission document | Personalized cards |
| Database | SQLite (simple) or Railway Postgres (persistent in the cloud) | Step 2 |
