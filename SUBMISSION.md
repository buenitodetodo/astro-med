# Space Apps team page: text for the Project tab

Drafts for the seven fields, in order. Review them and adjust the wording to match how the team presents the project.

## 1. Project Summary

Astro-Med is health monitoring software for astronauts on long missions, built for the challenge "Create Health Monitoring Software for Astronauts on Space Missions". On the way to Mars a message takes up to 22 minutes to reach Earth, so a crew cannot wait for a flight surgeon, and most health problems begin as small changes nobody notices. Astro-Med watches each astronaut every day against their own baseline and against thresholds taken from NASA documents, and shows the source of every alert. When the changes matter, two AI models that run on the team's own computers vote on the most likely condition from a NASA-derived catalog; if they disagree, the case is marked doubtful and escalated to Earth instead of guessed. It also handles emergencies with an SOS flow and first-aid cards, and prepares the report for Earth with the real communication delay. A separate simulator plays hidden scenarios day by day to show on which day the system noticed a problem and whether the diagnosis was right. It is for crews, flight surgeons and mission planners. Built with Astro, React, Hono, Cloudflare Workers, D1 and Workflows, and LM Studio with Phi-4, MedGemma and Gemma.

## 2. Project Demonstration

Link to the team's slides (maximum 7) or video (maximum 30 seconds).

## 3. Project

- Crew app: https://astro-med-web.astro-med.workers.dev
- Mission simulator: https://astro-med-panel.astro-med.workers.dev
- Code: https://github.com/buenitodetodo/Hackathon (the repository must be public for the judges to open it)

## 4. Project Details

**Data it uses.** For each astronaut: an Earth profile (age, sex, weight, height, blood type, allergies, history), a daily log (meals, sleep, exercise, mood, symptoms), vital signs (heart rate, heart rate variability, blood pressure, temperature, SpO₂) and radiation dose.

**How the parts connect.** Two web apps (the crew app and the simulator) talk to one API on Cloudflare Workers with a D1 database. The health logic is plain code: a calculator for energy, protein and fluid requirements, and a watcher that evaluates eight parameters. The AI doctor runs as a durable workflow that asks two models, ten rounds each, and counts the votes. The models run on the team's computers and are reached through secure tunnels.

**Step by step.** (1) The log keeper records the day. (2) The watcher compares it with the astronaut's own baseline and with sourced thresholds, and returns a traffic light per parameter with the source of each alert. (3) With a red alert, two alerts at once, or alerts two days in a row, it requests a preventive AI check; new symptoms trigger one follow-up. (4) Both models vote; agreement with at least 8 of 10 votes is high confidence, 6 or 7 is medium, anything else is doubtful and goes to Earth. (5) In an emergency, SOS gives 20 seconds to cancel, shows a first-aid card and opens the AI case. (6) The crew approves a report and the app simulates the trip to Earth and the reply.

**What it delivers.** A daily summary with a traffic light for eight parameters, nutrition and exercise progress, alerts with their sources, AI checks with votes and confidence, first-aid cards, reports to Earth, and a simulator with a day-by-day timeline, charts of each vital sign and a comparison between the AI diagnosis and the hidden answer.

**Results so far.** In 108 simulated scenarios the watcher raised no false alarms on healthy controls and detected every gradual scenario within two days of the hidden change. With the real models, a respiratory infection was marked doubtful on vital signs alone and diagnosed with high confidence one day later, when the cough appeared. These are simulated scenarios designed by the team, not a clinical validation.

## 5. Use of Artificial Intelligence (AI)

Three open language models running locally in LM Studio on the team's own computers, with no cloud AI service: Phi-4-reasoning-plus (14B) and MedGemma 4B each vote ten times on the most likely condition from a fixed catalog, and Gemma 3n (4B) powers the chat assistant and writes the report summary. The AI never calculates doses or numbers and never sees the simulator's answers. Its output is always labeled as a proposal that a physician has not validated, and disagreement between the models escalates the case to Earth. AI coding assistants (Claude) were used to help write and test the software, and Google Stitch to draft the interface design.

## 6. NASA Data

- JSC-67378, Nutritional Requirements for Exploration Missions: energy equation and nutrient requirements.
- NASA OCHMO Standards Overview (NASA-STD-3001): career radiation limit of 600 mSv and solar storm limit of 250 mSv.
- NASA OCHMO Technical Briefs TB-030 (bone loss), TB-031 (exercise) and TB-043 (monitored health changes).
- NASA Integrated Medical Model (IMM) condition lists: the catalog of 52 medical conditions.
- NASA Technical Reports Server: radiation dose rates measured on the ISS and communication delays for crewed Mars missions.
- NASA Standard Measures sleep data and NASA exercise countermeasure reports, used as references in the research.

## 7. Space Agency Partner & Other Data

- Canadian Space Agency: exercise on the ISS (reference).
- Peer-reviewed studies: Jones et al. 2022 (sleep on the ISS), Stahn et al. 2017 (body temperature in flight), Norsk et al. 2015 and Xu et al. 2013 (heart rate and blood pressure), English et al. 2020 (exercise protocols), Mishra et al. 2020 (detecting illness from personal baselines).
- USDA Agriculture Handbook 74: Atwater energy factors.
- General first-aid guidance for the emergency cards.
- Open models: Microsoft Phi-4-reasoning-plus, Google MedGemma and Gemma 3n. Tools: Astro, React, Hono, Cloudflare Workers, LM Studio.
