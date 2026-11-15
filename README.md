


![NASA Space Apps 2026](https://img.shields.io/badge/NASA%20Space%20Apps-2026-0B3D91?logo=nasa&logoColor=white) ![Status](https://img.shields.io/badge/status-demo%20live-brightgreen) ![Offline first](https://img.shields.io/badge/design-offline--first-brightgreen) ![Local AI](https://img.shields.io/badge/AI-runs%20locally-6E56CF) 

![Astro](https://img.shields.io/badge/Astro-BC52EE?logo=astro&logoColor=white) ![Hono](https://img.shields.io/badge/Hono-E36002?logo=hono&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-F38020?logo=cloudflare&logoColor=white) ![Cloudflare Tunnel](https://img.shields.io/badge/Cloudflare%20Tunnel-F38020?logo=cloudflare&logoColor=white) ![LM Studio](https://img.shields.io/badge/LM%20Studio-local%20AI-6E56CF)

![Last commit](https://img.shields.io/github/last-commit/buenitodetodo/astro-med) ![Repo size](https://img.shields.io/github/repo-size/buenitodetodo/astro-med) ![Top language](https://img.shields.io/github/languages/top/buenitodetodo/astro-med)

*NASA Space Apps Challenge 2026 · Project documentation*

> ![Titel ](https://i.postimg.cc/13DCXjpS/logo-astro-med(1).png)


## Table of contents

1. [Summary](#summary)
2. [Why this matters](#why-this-matters)
3. [Benefits](#benefits)
4. [Video](#video)
5. [Principles](#principles)
6. [The components](#the-components)
7. [What it monitors](#what-it-monitors)
8. [Architecture](#architecture)
9. [Emergency flow](#emergency-flow)
10. [Safety and limits](#safety-and-limits)
11. [Tech stack](#tech-stack)
12. [AI models](#ai-models)
13. [API](#api)
14. [Watchdog rules](#watchdog-rules)
15. [NASA data and sources](#nasa-data-and-sources)
16. [Repository structure](#repository-structure)
17. [Version plan](#version-plan)
18. [Demo script](#demo-script)
19. [How to run](#how-to-run)
20. [Pending decisions](#pending-decisions)
21. [Team and contributions](#team-and-contributions)
22. [License](#license)

## Summary

A health monitoring app for astronauts on space missions, designed to work **without an internet connection**. It combines a daily log and vital signs with a **code-based watchdog** that catches problems early, and a **local AI doctor** that supports the crew while the answer from Earth is on its way.

**Live demo:** [crew app](https://astro-med-web.astro-med.workers.dev) · [mission simulator](https://astro-med-panel.astro-med.workers.dev)

> **Challenge:** 
> ![Create Health Monitoring Software for Astronauts on Space Missions
Join the Challenge](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)    CHECK HERE 

## Why this matters

On distant missions such as Mars, communication with Earth takes between 3 and 21 minutes one way. The project aims to keep the crew from depending on that reply, both to prevent problems and to act in an emergency.

In flight, astronauts sleep about 6.5 hours a night, and with 6 hours or less their reaction time is measurably slower (Jones et al., 2022). Bone is lost at 1 to 2% per month in the hip and spine (NASA OCHMO-TB-030). These changes build up slowly, which is why daily monitoring matters.

![Earth to Mars: one-way signal delay, between 3 and 21 minutes](https://i.postimg.cc/65XzShkc/earth-mars-delay.png)

## Benefits

![Audience](https://img.shields.io/badge/audience-crew%20%C2%B7%20flight%20surgeon%20%C2%B7%20mission-blue)

- **For the crew:** they know what to do without waiting for Earth, and the app works offline.
- **For the flight surgeon on Earth:** reports arrive already structured and approved by the crew.
- **For the mission:** problems are caught early from the daily log and vital signs.

## Video

![Demo video](https://img.shields.io/badge/demo%20video-pending-lightgrey)


> 📷 **PHOTO — Video thumbnail.** A clickable thumbnail that opens the video. *Why it helps:* many judges decide from the video first.

## Principles

1. **Prevention first.** It predicts and prevents using vital signs and a daily log, and it also helps in emergencies.
2. **It supports the flight surgeon, it does not replace them.** It is an assistant while the answer from Earth arrives.
3. **It works offline.** The AI models run locally.
4. **Numbers are calculated by code, never by the AI.** Doses, EER, deficits and thresholds come from deterministic functions.
5. **No number enters the project without a verified source.** Every figure must have been checked against the original source (see `research/`, the research folder).

## The components

![Components](https://img.shields.io/badge/components-5-blue)

| Component | What it does |
|---|---|
| **Watchdog** | Always-on program, no AI. Compares the log and vital signs against the astronaut's personal baseline and against thresholds that have a cited source. With a red alert, two alerts at once, or alerts on two days in a row, it requests a preventive check from the AI doctor. |
| **Calculator** | Computes EER, protein, fluids and accumulated deficits. |
| **Local AI doctor** | Two models: a reasoning model (Phi-4-reasoning-plus, 14B) and a medical model (MedGemma, 4B). Each one votes 10 times on the most likely condition from a catalog of 52 conditions. If both agree with 8 or more votes the confidence is high; 6 or 7 is medium; anything else is doubtful and goes to Earth. |
| **ASTRO AI chat** | A small model (Gemma 3n, 4B) that answers questions with the astronaut's own data, writes the summary of the report to Earth, and starts an SOS if the astronaut asks for one. |
| **Mission simulator** | A separate panel that plays hidden scenarios day by day. The watchdog and the AIs only see the uploaded data, never the answer, so the panel can show on which day the system noticed and whether the diagnosis was right. |

Changed from the first plan: the small model does not stand between the watchdog and the doctor. The watchdog calls the AI doctor directly, and the small model became the chat assistant.

## What it monitors

![Parameters](https://img.shields.io/badge/parameters-8-blue)

| # | Parameter | Notes |
|---|---|---|
| 1 | Food intake and calories | Compared against the astronaut's EER |
| 2 | Heart rate | The trend in heart rate variability is tracked |
| 3 | Radiation exposure | Accumulated dose; shelter warning during a solar storm |
| 4 | Sleep | Hours and accumulated sleep debt |
| 5 | Body temperature | Threshold relative to the in-flight baseline |
| 6 | Blood pressure | Interpreted in the context of spaceflight |
| 7 | Muscle and bone mass | Hard to measure, so it is **predicted** from the Earth profile, with exercise recommendations (ARED, T2, CEVIS) |
| 8 | Blood oxygen (SpO₂) | Alert below 95% |

 ![Dashboard](https://i.postimg.cc/W1KZRNDc/907577765-29443277402035061-9181441908785427497-n.png)

## Architecture

![Offline first](https://img.shields.io/badge/design-offline--first-brightgreen)

```
  Crew app (Astro + React)            Simulator panel (Astro + React)
  astro-med-web  Worker               astro-med-panel  Worker
        |  /v1/*  (no /v1/sim)              |  only /v1/sim/*
        +---------------+-------------------+
                        |  service binding (the API has no public address)
                        v
              API  (Hono on Cloudflare Workers)
   +-----------+-----------+------------+-------------+
   | profile   | watchdog  | emergency  | simulator   |
   | log/meals | status    | SOS 20 s   | scenarios   |
   | vitals    | alerts    | reports    | ground truth|
   +-----------+-----+-----+------+-----+------+------+
                     |            |            |
                     v            v            v
                D1 (SQLite)   DoctorWorkflow (Cloudflare Workflows)
                              10 + 10 voting rounds, survives slow models
                                   |
                     Cloudflare Tunnel (one per machine)
                                   |
              +--------------------+--------------------+
              v                                         v
   Team PC, LM Studio                        Team laptop, LM Studio
   Phi-4-reasoning-plus (votes)              MedGemma 4B (votes)
   Gemma 3n (chat, report summary)
```

The same code runs fully local with `pnpm dev` and LM Studio on the same network: in that setup nothing leaves the team's machines.

The image below is the original design sketch; the text diagram above is what was built.

![System architecture diagram](https://i.postimg.cc/QxzCC6jW/architecture.png)

## Emergency flow

![SOS cancel window](https://img.shields.io/badge/SOS%20cancel%20window-20%20s-red)

1. The astronaut or crew presses the **SOS button**, or writes "SOS" in the chat.
2. At **second 1**, a **generic first-aid card** appears, before the AI responds.
3. The system asks *"Are you OK?"* and gives **20 seconds** to cancel.
4. The **AI doctor** receives the case: profile, symptoms, latest vital signs and watchdog alerts. Each model votes 10 times and the votes decide the confidence.
5. The result appears with the card for that condition and the critical profile data (blood type, weight, allergies, history).
6. If the case is outside the catalog, or the models disagree, it is labeled as such and **always escalated to Earth**.
7. A **report** is generated, the crew **approves** it, and it enters the **queue** to Earth with the simulated communication delay.

There are no falls in zero gravity, so the system does not try to detect them.

>![SOS](https://i.postimg.cc/nMfCYTwG/Captura-de-pantalla-2026-11-15-100159.png)

## Safety and limits

![Human in the loop](https://img.shields.io/badge/human-in%20the%20loop-yellow)

- It supports the flight surgeon, it does not replace them.
- Numbers (EER, doses, deficits, thresholds) are computed by code from a cited source, never by the AI.
- A case with no predefined card produces a generated text, always labeled *"no validated protocol"* and escalated to Earth.
- The crew approves every report before it enters the queue to Earth.
- An SOS can be cancelled within 20 seconds.
- Falls are not detected, because there is no fall in zero gravity.

## Tech stack

![Astro](https://img.shields.io/badge/Astro-BC52EE?logo=astro&logoColor=white) ![Hono](https://img.shields.io/badge/Hono-E36002?logo=hono&logoColor=white) ![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-F38020?logo=cloudflare&logoColor=white)

| Layer | Technology |
|---|---|
| Frontend | Astro with React, Tailwind. Installable as an app (PWA) and usable on a phone |
| Backend | Hono (TypeScript) on Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Long tasks | Cloudflare Workflows, for the 20 voting rounds |
| Deployment | Cloudflare Workers: one for the API, one for the crew app, one for the simulator |
| Connection to the local AI | Cloudflare Tunnel, one per machine |
| Model server | LM Studio (OpenAI-compatible API) |
| Models | Phi-4-reasoning-plus (14B) · MedGemma (4B) · Gemma 3n (4B) |
| Tests | Vitest: 75 tests across the API, the crew app and the shared package |

> ![dnate ](https://i.postimg.cc/NMT9n52t/911876749-1527877252733245-2227373090837826689-n.png)
> ![mio ](https://i.postimg.cc/yxHgCs0t/Captura-de-pantalla-2026-11-15-100912.png)

## AI models

![Models](https://img.shields.io/badge/models-3%20local-brightgreen)

| Role | Size | Model | Where it runs | Notes |
|---|---|---|---|---|
| Reasoning | 14B | **Phi-4-reasoning-plus** | Team PC | Votes 10 times on the condition |
| Medical | 4B | **MedGemma** | Team laptop | Second opinion, votes 10 times |
| Chat and summaries | 4B | **Gemma 3n** | Team PC | ASTRO AI chat and the report summary |

Measured on the team's hardware: the chat answers in about 4 seconds, and a full case (20 rounds on two machines) takes between 1 and 2 minutes.

First test with the real models, on two simulated scenarios: with vital signs only, the reasoning model guessed wrong and the medical model did not back it, so the case was marked doubtful and escalated to Earth. One day later, when the cough was logged, both models chose respiratory infection with high confidence. This is two scenarios, not a clinical validation.

## API

![Routes](https://img.shields.io/badge/routes-v1-blue)

All routes live under `/v1`. The crew app identifies the astronaut with a demo header; a real deployment needs a real identity provider.

| Method | Route | What it does |
|---|---|---|
| `GET` `PUT` | `/v1/profile` | Earth data: age, sex, weight, height, blood type, allergies and medical history |
| `GET` `POST` | `/v1/log` | Daily log: sleep, exercise, mood and symptoms |
| `GET` `POST` | `/v1/meals` | Meals of the day, by ration code or by values |
| `GET` `POST` | `/v1/vitals` | Pulse, heart rate variability, blood pressure, temperature and SpO₂, each with its source |
| `GET` | `/v1/nutrition` | Requirements computed for this astronaut |
| `GET` | `/v1/status` | Traffic light per parameter, alerts and the recommendation of the day |
| `POST` | `/v1/emergency` | SOS: generic card and the 20 s window |
| `POST` | `/v1/emergency/:id/cancel` | "I'm fine" within the 20 s window |
| `POST` | `/v1/doctor/case` | Sends a case to the models; the voting runs in the background |
| `GET` | `/v1/doctor/case/:id` | Progress and result of the vote |
| `GET` | `/v1/doctor/cases` | Recent preventive checks and emergency cases |
| `POST` | `/v1/doctor/chat` | ASTRO AI chat |
| `POST` | `/v1/reports` | Generates the report for Earth |
| `PATCH` | `/v1/reports/:id/approve` | The crew approves and the report enters the queue |
| `GET` | `/v1/queue` | Reports sent and their simulated trip to Earth |
| `*` | `/v1/sim/*` | Simulator: templates, scenarios and day-by-day advance. Only the panel can reach it |

## Watchdog rules

![Thresholds with source](https://img.shields.io/badge/thresholds-with%20cited%20source-green)

The requirements and limits below come from the cited sources. Full detail is in `research/01_astronaut_health.md`. The exact alert thresholds (how far from the personal baseline, how many days of deficit) are team decisions and the app labels them that way.

| Parameter | Rule | Source |
|---|---|---|
| Food intake | EER (JSC-67378 equation) against the log; alert on a deficit over several days in a row | JSC-67378 |
| Protein and fluids | 1.2-1.8 g/kg/day of protein; 32 ml/kg/day of fluids | JSC-67378 |
| Heart rate | Track the trend in variability; a resting pulse that rises in flight is abnormal | Xu 2013, Norsk 2015 |
| Radiation | Accumulated dose against the 600 mSv career limit; a solar storm means shelter | OCHMO Standards |
| Sleep | Alert at 6 h or less before a critical task; accumulated debt | Jones 2022 |
| Temperature | Threshold relative to the in-flight baseline, not a fixed value | Stahn 2017 |
| Blood pressure | Slightly lower is normal; in the weeks before return, remind about fluids and compression garments | Norsk 2015, Lee 2020 |
| Blood oxygen | Alert below 95% | General clinical range; no published spaceflight data |
| Muscle and bone | Predictors and 1-2% loss per month; limits: aerobic and strength 80% or more, bone 95% or more | OCHMO-TB-030, TB-031 |
| CO₂ *(planned, not built)* | 7-day average below 2.5 mmHg | OCHMO-TB-004 |
| Exams *(planned, not built)* | Reminders based on the official calendar (for example, eyes at L+30 and L+90) | OCHMO-TB-043 |

In the next example we told the ai that someone was losing blood 

[![Captura-de-pantalla-2026-11-15-101419.png](https://i.postimg.cc/T38S8ssf/Captura-de-pantalla-2026-11-15-101419.png)](https://postimg.cc/mtwVCmR5)

## NASA data and sources

![Sources](https://img.shields.io/badge/sources-NASA%20OCHMO%20%C2%B7%20JSC-0B3D91)

| NASA resource | Used for |
|---|---|
| JSC-67378, *Nutritional Requirements for Exploration Missions* | Energy equation and protein, fluid and macronutrient requirements |
| NASA OCHMO Standards Overview (NASA-STD-3001) | Career radiation limit (600 mSv) and solar storm limit (250 mSv) |
| OCHMO-TB-030 | Bone loss of 1–2% per month in spine and hip |
| OCHMO-TB-031 | Exercise prescription and requirements on the ISS |
| OCHMO-TB-043 and the NASA Integrated Medical Model condition lists | The catalog of 52 conditions the AI doctor chooses from |
| NASA Technical Reports Server | Radiation dose rates measured on the ISS and communication delay to Mars |

Other sources: peer-reviewed studies on astronauts (Jones 2022, Stahn 2017, Norsk 2015, Xu 2013, English 2020), Mishra 2020 on detecting illness from a personal baseline, and USDA Handbook 74 for the Atwater factors. Full detail and links are in `research/`.

**Honest limit:** the project uses NASA standards, technical briefs and published measurements. It does not yet ingest a NASA dataset of raw measurements. The NASA Open Science RadLab portal (real radiation dose rates from the ISS) is identified in the research as the next step.


## Repository structure

![Docs](https://img.shields.io/badge/docs-WORKFLOW%20%C2%B7%20research-blue)

```
apps/
├── api/                         The API. src/salud is the health logic, src/rutas the routes, migrations the database
├── web/                         The crew app: Summary, Biometrics, ASTRO AI, SOS, History
└── panel/                       The mission simulator
packages/shared/                 Types and validation shared by the API and the apps
research/                 Research, in Spanish, with a source for every number
├── 01_astronaut_health.md       The parameters, NASA datasets and PDFs
├── 02_general_datasets.md       NASA conditions, medical text, vital signs, nutrition
├── 03_from_hackathonchido.md    Sources and technical data from HackathonChido
└── 04_pending_data.md           Sources found for the numbers that were pending, and what is still a team decision
SUBMISSION.md                    Draft text for the seven fields of the Space Apps team page
WORKFLOW.md                      The original plan and working notes
```

## Version plan

![Versions](https://img.shields.io/badge/versions-V1%E2%80%93V6-blue)

| Version | What it delivers | Status |
|---|---|---|
| V1 | Profile, log and vitals with validation and storage | ![V1](https://img.shields.io/badge/V1-done-brightgreen) |
| V2 | Calculator and watchdog with sourced rules | ![V2](https://img.shields.io/badge/V2-done-brightgreen) |
| V3 | Emergency: SOS, generic card and cancellation at 20 s | ![V3](https://img.shields.io/badge/V3-done-brightgreen) |
| V4 | Rebuilt on Cloudflare Workers and D1, with tests | ![V4](https://img.shields.io/badge/V4-done-brightgreen) |
| V5 | AI doctor with the real models, reports to Earth, crew app, simulator, deployed | ![V5](https://img.shields.io/badge/V5-done-brightgreen) |
| V6 | Stability, phone layout, installable app | ![V6](https://img.shields.io/badge/V6-done-brightgreen) |

Each version that works is saved in `versions/` before the next big change. If a change breaks something, the project goes back to the last good version.

## Demo script

![Demo](https://img.shields.io/badge/demo-live-brightgreen)

1. In the simulator, pick an astronaut and the "Developing respiratory infection" scenario. Only the simulator knows the hidden day and the answer.
2. Press Play: one day of data is uploaded per second. The watchdog stays green until the hidden day, then raises alerts with their sources.
3. The watchdog requests a preventive AI check. With vital signs only the models are unsure and the case goes to Earth; when the cough is logged, the follow-up check gives the diagnosis.
4. In the crew app, the same astronaut shows the AI notice. Open History, prepare the report, approve it and watch it travel to Earth.
5. Emergency: SOS button, generic card at second 1, 20 seconds to cancel, AI doctor and result card.

The public demo runs on Cloudflare and reaches the models through tunnels. To show it with the internet unplugged, run everything on the local network with `pnpm dev`.


[![Captura-de-pantalla-2026-11-15-101953.png](https://i.postimg.cc/W3r87p2y/Captura-de-pantalla-2026-11-15-101953.png)](https://postimg.cc/hzDVDBQ8)

## How to run

![Ready](https://img.shields.io/badge/setup-ready-brightgreen)

Live demo: [crew app](https://astro-med-web.astro-med.workers.dev) · [mission simulator](https://astro-med-panel.astro-med.workers.dev)

To run it locally you need Node 22 or newer and pnpm.

```bash
pnpm install
```

```bash
pnpm dev
```

The crew app opens on `http://localhost:4330`, the simulator on `http://localhost:4334` and the API on `http://localhost:8787`. The AI doctor and the chat need LM Studio serving on port 1234 with the three models loaded; everything else works without it.

```bash
pnpm test
```

To publish the demo, start a Cloudflare Tunnel on each machine that runs LM Studio and then:

```bash
node apps/api/scripts/connect-ai.mjs https://PC-TUNNEL.trycloudflare.com https://LAPTOP-TUNNEL.trycloudflare.com
```

The script checks that each machine answers with the right models and publishes the API with those addresses.

## Pending decisions

![Open decisions](https://img.shields.io/badge/open%20decisions-3-yellow)

| Decision | State |
|---|---|
| Voting confidence thresholds | **Decided: Proposal A.** 8 of 10 or more with both models agreeing is high confidence, 6-7 is medium, anything else escalates to Earth |
| Database | **Decided: Cloudflare D1** (SQLite) |
| Exact alert thresholds | Open. Two standard deviations from the personal baseline, the minimum margins and three days of deficit are team decisions, labeled as such in the app. They need validation with real data. See `research/04_pending_data.md` |
| Medical kit and crew medical level | Open. To be defined in a simulated mission document |
| Real NASA measurements | Open. Use the RadLab radiation data from the ISS in the simulator |

## Team and contributions

![Team](https://img.shields.io/badge/team-to%20be%20added-lightgrey)

| Name | Role |
|---|---|
| **Dante** | **Back-End Programmer And Team Leader** |
| **Isadillas** | **Front-End Designer And General design** |
| **Rodrigo** | **Documentore, Main Investigator And Brainstormer  ** |



[![Whats-App-Image-2026-11-15-at-10-22-34-AM.jpg](https://i.postimg.cc/Dz38X7MW/Whats-App-Image-2026-11-15-at-10-22-34-AM.jpg)](https://postimg.cc/Hr3YG1HH) 

