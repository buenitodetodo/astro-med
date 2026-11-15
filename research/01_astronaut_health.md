[01_astronaut_health.md](https://github.com/user-attachments/files/34880058/01_astronaut_health.md)
# Research: Astronaut Health on Space Missions

**Project:** NASA Space Apps Challenge 2026 — "Create Health Monitoring Software for Astronauts on Space Missions"
**Compilation date:** November 14, 2026
**Intended use:** knowledge base for the AI doctor (document search) and parameter reference for the simulation.
**Version 2 (12:25):** added datasets from NASA and partner agencies (section 9), long-term surveillance OCHMO-TB-043 (section 8), downloadable PDFs for training (section 13) and coverage per parameter (section 14).

## How to Read This Document

- Each data point has a **source** (link or DOI), **sample size (n)** and **mission type** when known.
- **Status:**
  - ✅ **VERIFIED** — the figure was confirmed in the original source (article, PubMed abstract or NASA document).
  - ⚠️ **PARTIAL** — the source is secondary, the figure could not be fully confirmed, or it has important caveats.
  - ❌ **INCORRECT** — found in earlier research but false or wrongly attributed. Do not use.
- **Mission types:** ISS = International Space Station (long missions, ~6 months). Shuttle = short flights (days). Mir = Russian station (retired). I4 = Inspiration4 (3 days, civilian crew). Analog = ground-based study that simulates space (bed rest, confinement).
- Team rule: **no number enters the project unless someone has seen it in the original source.**

---

## 1. Intake and Calories

### How it works
Astronauts eat less than they spend. Energy expenditure does not drop in space (they exercise ~2.5 h a day), but intake does. The deficit accumulates and shows up as loss of weight, muscle and bone.

### Data

| Parameter | Value | n / Mission | Source | Status |
|---|---|---|---|---|
| Energy expenditure in flight | 3,320 ± 155 kcal/day | 4 astronauts / Shuttle, 16 days | [NTRS 20040141933](https://ntrs.nasa.gov/citations/20040141933) | ✅ |
| Intake before flight | 3,025 ± 180 kcal/day | Same study | NTRS 20040141933 | ✅ |
| Intake in flight | 1,943 ± 179 kcal/day | Same study | NTRS 20040141933 | ✅ |
| Negative balance | −1,355 ± 80 kcal/day (−15.7 kcal/kg/day) | Same study | NTRS 20040141933 | ✅ |
| In-flight requirement equation | E = 1.40 × resting metabolic rate + exercise | Same study | NTRS 20040141933 | ✅ |
| Intake on long missions | 80% of recommended energy; lower weight at landing | 11 astronauts / ISS, 128-195 days | Smith et al., *J Nutr* 2005 — [DOI](https://doi.org/10.1093/jn/135.3.437) | ✅ |
| Intake on long missions (another report) | 74 ± 11% of the WHO recommendation | 15 astronauts / ISS | [NTRS 20060049121](https://ntrs.nasa.gov/api/citations/20060049121/downloads/20060049121.pdf) | ✅ |
| Intake trend | Drops over time during the mission; with in-flight nutritional counseling, one astronaut maintained adequate intake | ISS, Expeditions 1-8 | [NASA Clinical Nutrition Assessment](https://corpora.tika.apache.org/base/docs/govdocs1/854/854159.html) | ✅ |
| Intake versus recommendation (general) | 30-40% below WHO; expenditure unchanged or higher | Short and long flights | NASA Clinical Nutrition Assessment | ✅ |
| Weight loss at 3 months | −1.20 kg average | 11 astronauts / ISS, 6 months | Bourdier et al., *Sports Med* 2022 — [DOI](https://doi.org/10.1007/s40279-022-01728-6) | ✅ |
| Vitamin D | Low after flight, even with supplements | 11 astronauts / ISS | Smith 2005 | ✅ |
| Oxidative damage | Increases after flight | 11 astronauts / ISS | Smith 2005 | ✅ |
| Average energy per crew member (spacecraft design) | 3,035 kcal/day | Standard | [NASA OCHMO-TB-002 (ECLSS)](https://www.nasa.gov/wp-content/uploads/2023/07/eclss-technical-brief-ochmo.pdf) | ✅ |

### Official Requirements (JSC-67378, Nutritional Requirements for Exploration Missions)
Source: [JSC-67378](https://ntrs.nasa.gov/api/citations/20205008306/downloads/JSC67378%20Expl%20Nutr%20Reqs%20042020.pdf) — ✅ VERIFIED

| Requirement | Value |
|---|---|
| Energy, men (19+) | EER = 622 − 9.53 × age [years] + 1.11 × (15.9 × mass [kg] + 539.6 × height [m]) |
| Energy, women (19+) | EER = 354 − 6.91 × age [years] + 1.11 × (9.36 × mass [kg] + 726 × height [m]) |
| Activity factor | 1.11 (low activity); rises to 1.25 if there is exercise equipment comparable to the ISS's |
| Spacewalk (EVA) | +200 kcal per hour of EVA, with a nutrient profile similar to the rest of the diet |
| Protein | 1.2 to 1.8 g per kg of body mass per day |
| Carbohydrates | 45-65% of daily energy; added sugars <10% |
| Fat | 20-35% of daily energy |
| Fluids | 32 ml per kg per day (food + drinks); minimum 2,500 ml/day men and 2,100 ml/day women |

### Rule for the app
The code calculates the requirement with the EER equation, compares it with the logbook and accumulates the deficit. If the deficit grows for several days in a row, the AI doctor recommends increasing intake (especially protein). **Numerical calculations are done by the code, not the AI.**

---

## 2. Heart Rate and Heart Rate Variability

### How it works
Without gravity, the heart does not have to pump blood "uphill". In flight, resting pulse barely changes, but heart rate variability (HRV) drops. The main problem appears on returning to gravity.

### Data

| Parameter | Value | n / Mission | Source | Status |
|---|---|---|---|---|
| Sleeping pulse in flight | No change in flight | 7 astronauts / ISS, up to 6 months | Xu et al., *Am J Physiol Regul* 2013 — [DOI](https://doi.org/10.1152/ajpregu.00423.2012) | ✅ |
| Sleeping pulse on return | 59.6 ± 8.9 bpm versus 53.3 ± 7.3 bpm before flight (P < 0.01) | Same study | Xu 2013 | ✅ |
| Variability in flight | Decreases at all frequencies (time and spectral); partially recovers at landing | Same study | Xu 2013 | ✅ |
| 24-h pulse (another study) | No change in flight | 8 men / ISS | Norsk et al., *J Physiol* 2015 — [DOI](https://doi.org/10.1113/jphysiol.2014.284869) | ✅ |
| Variability recovery | Reduced vagal control for 5 days after return; almost recovered at 30 days | 8 astronauts / ISS | Vandeput et al., *Med Sci Monit* 2013 — [DOI](https://doi.org/10.12659/msm.883724) | ✅ |
| Pulse on standing up (landing day) | +11 bpm without compression garments; elevated for at least 2 weeks | 87 person-missions / ISS >4 months | Lee et al., *J Appl Physiol* 2025 — [DOI](https://doi.org/10.1152/japplphysiol.00646.2024) | ✅ |
| Changes between mission phases (I4) | Variability F = 5.64, P = 0.0046; pulse F = 37.10, **P < 0.0001** | 4 / I4, 3 days | Jones et al., *Nature* 2024 — [DOI](https://doi.org/10.1038/s41586-024-07648-x) | ✅ |
| CO₂ and variability (I4) | 3 of 4 astronauts showed a significant positive association between CO₂ and higher variability | 4 / I4 | Jones 2024 | ✅ |
| Device used in I4 | Apple Watch Series 6 | 4 / I4 | Jones 2024 | ✅ |
| Cardiovascular changes in I4 | Modest; the heart beats slower because it does not work against gravity | 4 / I4 | [Penn Medicine](https://pennmedicine.org/news/news-releases/2024/june/first-study-of-civilian-space-crew-charts-course-for-research-as-commercial-flight-heats-up) | ✅ |

### Rule for the app
- The cardiac forecast is based on **the variability trend**, not on resting pulse.
- A resting pulse that **rises** in flight is abnormal (it normally does not change) → alert.

---

## 3. Radiation Exposure

### How it works
- **Galactic cosmic rays (GCR):** chronic exposure, highly penetrating, hard to shield. Their intensity varies with the ~11-year solar cycle.
- **Solar particle events (SPE / solar storms):** sudden, easier to shield, dangerous in the short term. The crew takes shelter in the most shielded area ("storm shelter").
- On the ISS, exposure comes from cosmic rays modified by Earth's magnetic field and from passes through the South Atlantic Anomaly (trapped proton belt).

### Data

| Parameter | Value | Mission | Source | Status |
|---|---|---|---|---|
| Measured dose rate on the ISS | ~0.2 to 0.5 mSv/day | ISS | Simonsen et al., NASA — [NTRS 20250006168](https://ntrs.nasa.gov/api/citations/20250006168/downloads/ASCEND%20Simonsen%20draft%201.pdf) | ✅ |
| Dose per 6-month mission | ~40 to 90 mSv | ISS, 6-8 months | Simonsen et al. | ✅ |
| Career limit | < 600 mSv | NASA standard | [OCHMO Standards Overview](https://www.nasa.gov/wp-content/uploads/2021/09/ochmo_standards_overview_sept_15_2021_francisco.pdf) | ✅ |
| Limit per solar storm | < 250 mSv per event | NASA standard | OCHMO Standards Overview | ✅ |
| Onboard nuclear sources | < 20 mSv per mission year | NASA standard | OCHMO Standards Overview | ✅ |
| Daily cosmic ray limits (design) | < 1.3 mSv/day in free space; < 0.8 mSv/day on a planetary surface | **"Under consideration"**, not approved | OCHMO Standards Overview | ⚠️ |
| Missions to Mars | The longest ones could approach or exceed the 600 mSv limit | Projection | Simonsen et al. | ✅ |
| Monitoring | Personal and area dosimeters; NASA-STD-3001 V2 6161 and 6162 | ISS | [OCHMO radiation brief](https://www.nasa.gov/sites/default/files/atoms/files/radiation_protection_technical_brief_ochmo.pdf) | ✅ |

### Real Radiation Data (for training)

| Source | What it contains | Access | Status |
|---|---|---|---|
| [OSDR RadLab](https://visualization.osdr.nasa.gov/radlab/) | Absorbed dose rate, dose equivalent and particle flux, with ISS position. DORELI detectors (DOSTEL1, DOSTEL2, Lidal, REM; Italian Space Agency), three Liulin-5 (Bulgaria) and RAD, REM and TEPC (NASA/SRAG) | Portal with CSV/TSV/JSON export and public API | ✅ |
| [RadLab Data API](https://visualization.osdr.nasa.gov/radlab/gui/data-api) | GET queries to `https://visualization.osdr.nasa.gov/radlab/api` | No account needed | ✅ |
| [Environmental Data App](https://visualization.osdr.nasa.gov/eda) | Cosmic rays, South Atlantic Anomaly, accumulated and total dose; plus cabin temperature, humidity and CO₂ | Download of summary and full tables | ✅ (Rodent Research mission periods) |

Example query (dose and flux on the ISS with DosTel instruments, TSV format):
```
https://visualization.osdr.nasa.gov/radlab/api/?spacecraft=ISS&instrument=DosTel&timestamp>=2022-04-01T23:00&timestamp<2022-04-02T01:05&absorbed_dose_rate&flux&latitude&longitude&altitude&format=tsv
```
RadLab was already used to train predictive models in the FDL-X 2024 challenge ([NTRS 20240012790](https://ntrs.nasa.gov/citations/20240012790)).
Required citation: "Data and visualizations are courtesy of the RadLab Portal (https://visualization.osdr.nasa.gov/radlab/gui/overview/), Version #."

### Rule for the app
Accumulated dose per astronaut against their career limit (progress bar) and solar storm alert → shelter. Radiation is **managed**, not prevented with habits.

---

## 4. Sleep (Hours and Quality)

### How it works
Changing schedules, noise, artificial light and the lack of a normal day and night cycle throw off the biological clock. They sleep less even when 8.5 h are scheduled.

### Data

| Parameter | Value | n / Mission | Source | Status |
|---|---|---|---|---|
| Hours of sleep in flight | 6.5 ± 1.4 h | 24 astronauts / ISS, ~6 months | Jones et al., *Sleep* 2022 — [PMC8919197](https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197/) | ✅ |
| Weekends versus weekdays | 6.9 h versus 6.3 h | Same study | Jones 2022 | ✅ |
| Nights with the full 8.5 h scheduled | 5.9% | Same study | Jones 2022 | ✅ |
| **Fatigue threshold** | With ≤6 h of sleep, psychomotor response was significantly slower (34.9% of nights) | Same study | Jones 2022 | ✅ |
| Sleep by actigraphy (another record) | 7.33 ± 1.16 h in flight (2,137 nights) versus 7.87 ± 1.10 h before flight | 19 crew members / Standard Measures | [NTRS 20230003916](https://ntrs.nasa.gov/citations/20230003916) (conference poster) | ✅ |
| Sleep on the ISS (earlier study) | 6.09 ± 0.67 h in flight | 21 astronauts / ISS | Barger et al., *Lancet Neurol* 2014 — [DOI](https://doi.org/10.1016/S1474-4422(14)70122-X) | ✅ |
| Sleep medications | 12 of 16 (75%) on the ISS | Same study | Barger 2014 | ✅ |
| Sleep architecture | Efficiency −17.7%, REM −25.8%, non-REM −14.1% | **5 people on Mir** (4 cosmonauts + 1 astronaut), conference abstract | [ScienceDaily](https://sciencedaily.com/releases/2020/08/200826110331.htm) | ⚠️ Not from the ISS |
| Countermeasure: lighting | The ISS installed LED lighting to improve sleep, circadian rhythm and alertness | Review | Brainard et al., 2016 — [DOI](https://doi.org/10.1097/MCP.0000000000000329) | ✅ |
| Countermeasure: caffeine + blue light | In sleep-deprived people, caffeine improved attention; with blue light it was most effective | 16 participants / simulation | Liu et al., *NPJ Microgravity* 2023 — [DOI](https://doi.org/10.1038/s41526-023-00299-8) | ✅ |

### Rule for the app
Accumulated sleep debt and an alert if they sleep ≤6 h before a critical task (for example, a spacewalk).

---

## 5. Body Temperature

### How it works
Without gravity, the body loses heat with more difficulty (there is no natural convection: hot air does not "rise"). There is also an inflammatory response.

### Data

| Parameter | Value | n / Mission | Source | Status |
|---|---|---|---|---|
| Resting temperature | Sustained increase of ~1 °C, developed gradually over 2.5 months | Astronauts / ISS, long missions | Stahn et al., *Sci Rep* 2017 — [DOI](https://doi.org/10.1038/s41598-017-15560-w) | ✅ |
| Temperature during exercise | Rises higher and faster than on Earth | Same study | Stahn 2017 | ✅ |
| Associated marker | Increase in interleukin-1 receptor antagonist (anti-inflammatory protein) | Same study | Stahn 2017 | ✅ |
| Circadian temperature rhythm | Resistance exercise counteracted the shift of the temperature rhythm | 16 men / **analog** (bed rest) | Mendt et al., *NPJ Microgravity* 2021 — [DOI](https://doi.org/10.1038/s41526-020-00129-1) | ✅ |

### Rule for the app
**Do not use 37.5 °C as the fever threshold.** The threshold must be relative to each astronaut's in-flight baseline.

---

## 6. Blood Pressure and Fluids

### How it works
Upon entering weightlessness, ~2 liters of fluid move from the lower to the upper body. The body detects the excess above and reduces total blood volume. The vessels relax and pressure drops. On return, gravity pulls blood into the legs and it is not enough to maintain pressure (orthostatic intolerance).

### Data

| Parameter | Value | n / Mission | Source | Status |
|---|---|---|---|---|
| Fluid shift | ~2 liters from the lower to the upper body | General | [NASA Cardiovascular and Vision](https://www.nasa.gov/content/cardiovascular-health) | ✅ |
| Body's response | Reduces total blood volume | General | [NASA Ensuring Astronaut Health](https://www.nasa.gov/?p=207552) | ✅ |
| Systolic pressure (24 h) | −8 ± 2 mmHg in flight | 8 men / ISS, days 85-192 | Norsk et al., *J Physiol* 2015 — [DOI](https://doi.org/10.1113/jphysiol.2014.284869) | ✅ |
| Diastolic pressure (24 h) | −9 ± 2 mmHg | Same study | Norsk 2015 | ✅ |
| Mean pressure (24 h) | −10 ± 3 mmHg | Same study | Norsk 2015 | ✅ |
| Nighttime pressure dip | Maintained (8 ± 3 mmHg) | Same study | Norsk 2015 | ✅ |
| Stroke volume / cardiac output | +35 ± 10% / +41 ± 9% | Same study | Norsk 2015 | ✅ |
| Vessel resistance | −39 ± 4% | Same study | Norsk 2015 | ✅ |
| Intolerance to standing (landing) | >60% did not complete a 10-min tilt test after ~6 months | ISS | Lee et al., *Front Physiol* 2020 — [DOI](https://doi.org/10.3389/fphys.2020.00784) | ✅ |
| Arterial stiffness on return | +17 to 30% in the carotid | 4 men + 4 women / ISS, 6 months | Hughson et al., *Am J Physiol Heart* 2016 — [DOI](https://doi.org/10.1152/ajpheart.00802.2015) | ✅ |
| Countermeasures on return | Graduated compression garments and fluid loading | — | NASA Cardiovascular and Vision | ✅ |
| Countermeasures in flight (being tested) | Negative pressure on the lower body and thigh cuffs | — | NASA Ensuring Astronaut Health | ✅ |
| General trend (review) | Pulse, pressure and pulse pressure drop in flights of up to 6 months (no figures) | Review | Tomsia et al., *Front Physiol* 2024 — [DOI](https://doi.org/10.3389/fphys.2024.1284644) | ⚠️ Review, no numbers |

### Rule for the app
Slightly lower pressure in flight is normal (do not alarm). What matters is **preparing for the return**: weeks before landing, remind about fluid loading and compression garments.

---

## 7. Muscle and Bone Mass

### How it works
Bone and muscle are maintained by the load of gravity. Without it, the body breaks them down. What is lost most is what bears weight on Earth: **legs, hips and spine**. The arms barely change.

### Data: bone

| Parameter | Value | n / Mission | Source | Status |
|---|---|---|---|---|
| Loss per month | 1-2%/month in lumbar spine and hip; no change in arms | Mir and ISS | [NASA OCHMO-TB-030 (Rev B)](https://nasa.gov/wp-content/uploads/2023/03/bone-loss-technical-brief-ochmo-1.pdf) | ✅ |
| Loss per month (review) | ~1% lumbar spine, ~1.5% hip | Review | McCarthy, *Ann Biomed Eng* 2005 — [DOI](https://doi.org/10.1007/s10439-005-8967-6) | ✅ |
| Severe cases | >50% of long-mission crew members (average 170 days) lost 10% at at least one site | Mir and ISS | [NASA OCHMO-TB-030 (Rev C)](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-030-bone-loss.pdf) | ✅ |
| With modern exercise | Femoral neck −1.7% | 26 crew members / ISS | English et al., *NPJ Microgravity* 2020 — [DOI](https://doi.org/10.1038/s41526-020-00111-x) | ✅ |
| Distal tibia | Strength and density −2.9% to −4.3% | 17 astronauts / ISS, 3.5-7 months | Gabel et al., *Br J Sports Med* 2021 — [DOI](https://doi.org/10.1136/bjsports-2020-103602) | ✅ |
| Loss curve over time | Not characterized for 6 months; no data for longer missions; unknown whether it stabilizes | — | [NTRS 20170004597](https://ntrs.nasa.gov/api/citations/20170004597/downloads/20170004597.pdf) | ✅ |
| NASA bone health standard | Density T-scores by DXA (dual-energy X-ray absorptiometry) | — | [PMC6418107](https://pmc.ncbi.nlm.nih.gov/articles/PMC6418107) | ✅ |

### Data: muscle and strength

| Parameter | Value | n / Mission | Source | Status |
|---|---|---|---|---|
| Muscle volume | Calf −10 to −16%; thigh −4 to −7%; arm +0.4 to −0.8% | 4 men / ISS, 181 ± 15 days | Gopalakrishnan et al., *Aviat Space Environ Med* 2010 — [DOI](https://doi.org/10.3357/asem.2583.2010) | ✅ |
| Strength | Knee −10.4 to −24.1%; ankle −4 to −22.3%; elbow −7.5 to −16.7% | Same study | Gopalakrishnan 2010 | ✅ |
| Exercise load | On the ISS, impact force when running and cycling was ~46% and ~50% lower than on Earth | Same study | Gopalakrishnan 2010 | ✅ |
| With modern exercise | Knee extensor strength −5.8%; aerobic capacity (VO₂) −6.1% | 26 crew members / ISS | English 2020 | ✅ |
| Insulin resistance | Increases in flight (P < 0.001), more in men | 8 / ISS, 6 months | Hughson 2016 | ✅ |

### Exercise On Board (ISS)

| Data point | Value | Source | Status |
|---|---|---|---|
| Equipment | Resistance: ARED (Advanced Resistive Exercise Device). Aerobic: T2 treadmill and CEVIS bike | [NTRS 20230004166](https://ntrs.nasa.gov/api/citations/20230004166/downloads/Varanoske_ACSM%202023%20Poster_Final%20H-3PO.pptx.pdf) | ✅ |
| ARED exercises | Heel raises, squats and deadlifts (legs); bench press, biceps curl (arms) | NTRS 20230004166; [Canadian Space Agency](https://www.asc-csa.gc.ca/eng/astronauts/living-in-space/physical-activity-in-space.asp) | ✅ |
| Loads per session | Squat 181 lb, deadlift 192 lb, heel raise 239 lb, bench press 122 lb (medians) | [npj Microgravity 2023](https://www.nature.com/articles/s41526-023-00256-5.pdf) | ✅ |
| Total exercise time | ~600 min/week per crew member (range ~450 to 720) | npj Microgravity 2023 | ✅ |
| Allotted time | 2.5 h/day, 6-7 days/week | Hackney et al., *J Strength Cond Res* 2015 — [DOI](https://doi.org/10.1519/JSC.0000000000001191) | ✅ |
| Equipment capacity | Resistance up to 273 kg; treadmill 0.44-5.5 m/s; bike 0-350 W | Hackney 2015 | ✅ |
| Efficient alternative | High-intensity, lower-volume training (Sprint) gave similar results in less time | English 2020 | ✅ |
| Aerobic requirement (NASA-STD-3001 V1 4003) | In-flight aerobic capacity ≥ 80% of pre-flight | [OCHMO-TB-031](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-031-exercise-overview.pdf) (updated 02/04/2026) | ✅ |
| Minimum VO₂max for EVA (V1 4001, 4002) | 32.9 ml/(min·kg) in microgravity; 36.5 ml/(min·kg) on the surface | OCHMO-TB-031 | ✅ |
| Strength requirement (V1 4024) | In-flight strength ≥ 80% of baseline | OCHMO-TB-031 | ✅ |
| Bone requirement (V1 4027) | Density ≥ 95% at hip and spine; ≥ 90% at femoral neck | OCHMO-TB-031 | ✅ |
| ISS prescription (~180 days) | 6-7 days/week; aerobic ~30 min (intervals or continuous); resistance 30-60 min with load | OCHMO-TB-031 | ✅ |
| Measured sessions | CEVIS average 26 min, T2 27 min; ~600 min/week | OCHMO-TB-031 | ✅ |
| Short flights (≤14 days) | ≥3 sessions/week of ≥20 min at ≥70% of max heart rate → VO₂max −9.2%; with fewer sessions −15.3% or −22.6% | OCHMO-TB-031 | ✅ |
| Results 2012-2022 | 12-21% of crew members fell below the aerobic requirement (−20%) | OCHMO-TB-031 | ✅ |
| Recovery on return | 45 days from R+1, 2 h/day, 7 days/week; peak VO₂ returned to baseline in ~30 days | OCHMO-TB-031 | ✅ |

### Loss Predictors (for prediction with Earth data)

| Predictor | What it says | Source |
|---|---|---|
| Mission duration | Significantly predicts bone loss | Gabel 2021 |
| Bone turnover markers before flight | More turnover before flight → more loss of strength and density | Gabel 2021 |
| Exercise history and volume | More resistance volume in flight → tibial strength and density are preserved | Gabel 2021 |
| Baseline muscle mass and vigorous activity | Those who maintained expenditure and vigorous activity kept muscle; the rest lost muscle and gained fat | Bourdier 2022 |
| Age, sex, weight, height | Enter the official energy equation | JSC-67378 |

### Analog Data (NASA bed rest) for the Loss Curve

These are NASA **open** data in "tidy" format (one variable per column, ready for models). They come from **head-down tilt bed rest** (6°) on Earth, not from flight: label them as "analog".

| Dataset | What it measures | Link | Status |
|---|---|---|---|
| UTMB Bedrest Campaign 1 | Bone, muscle, cardiovascular system | [NLSP C1](https://nlsp.nasa.gov/explore/data/details/6eaf1654-72d4-5d71-a9dd-a02e674c6473?dataType=MISSIONS) | ✅ Real, open (download format to be confirmed) |
| UTMB Bedrest Campaign 3 | Bone, cardiovascular system, neurology | [NLSP C3](https://nlsp.nasa.gov/explore/data/details/593a6726-8650-551a-8d67-0f03468de92f?dataType=MISSIONS) | ✅ |
| UTMB 70 days (Campaign 11 / CFT70) | 70 days of bed rest with exercise countermeasures and functional tests | [NLSP 70 days](https://nlsp.nasa.gov/explore/data/details/8e583564-d124-58ce-b44a-a16bb5b5d981?dataType=MISSIONS) | ✅ |
| MR035G | Bone density by DXA: loss and recovery throughout bed rest | Inside NLSP (search "MR035G") | ✅ (source: [IWS 2026](https://ntrs.nasa.gov/api/citations/20260002548/downloads/IWS_Tidy_Data_Presentation_Update.pdf)) |
| MR079G | Isokinetic strength and endurance of knee, ankle and back before and after | Inside NLSP (search "MR079G") | ✅ (source: IWS 2026) |

Use: CFT70 compares groups with and without exercise. It helps the logbook estimate how much the recorded exercise protects.

### Rule for the app
1. The astronaut enters their Earth data (weight, BMI, muscle mass, body fat %, age, exercise history, medical history).
2. The code calculates their risk with the predictors and projects their monthly loss using the published rates.
3. Real ARED, T2 and CEVIS exercises are recommended, prioritizing legs, hips and spine.
4. If the recorded exercise volume drops, the risk goes up.
5. **Present it as a "risk estimate", not a measurement.** There is a lot of variation between people.

---

## 8. Other Relevant Topics

### Environment: CO₂

| Parameter | Value | Source | Status |
|---|---|---|---|
| CO₂ limit | 1-hour average ≤ 3 mmHg (NASA-STD-3001 V2 6004) | [NASA OCHMO-TB-004](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf) | ✅ |
| Headaches | 19 of 49 astronauts (~38.7%) reported headaches | [NASA OCHMO-TB-004 (page)](https://www.nasa.gov/?p=841628) | ✅ |
| Preventive threshold | 7-day average < 2.5 mmHg to keep headache risk < 1% | NASA OCHMO-TB-004 | ✅ |
| Current range on the ISS | 1 to 9 mmHg | NASA OCHMO-TB-004 | ✅ |
| Headache risk | Each +1 mmHg of CO₂ doubles the risk | Evans, *Aerosp Med Hum Perform* 2025 — [DOI](https://doi.org/10.3357/AMHP.6716.2025) | ✅ |

### Kidney (stones)

| Parameter | Value | Source | Status |
|---|---|---|---|
| Risk | Increases in flight even with exercise; key factor: lower urine volume; easiest countermeasure: more fluids | Smith et al., *Bone* 2015 — [DOI](https://doi.org/10.1016/j.bone.2015.10.002) | ✅ |
| Urinary calcium (Skylab) | +89, +124, +142 and +160 mg after 1, 2, 3 and 4 weeks; measurable with portable devices | Ren et al., *Aerosp Med Hum Perform* 2020 — [DOI](https://doi.org/10.3357/AMHP.5606.2020) | ✅ |

### Blood (space anemia)

| Parameter | Value | Source | Status |
|---|---|---|---|
| Hemolysis | Hemoglobin breakdown products elevated throughout the mission; effects persist for 1 year | Trudel et al., *Nature Medicine* 2022 — [DOI](https://doi.org/10.1038/s41591-021-01637-7) (14 astronauts, 6 months) | ✅ |
| "+54% red blood cells destroyed" | Widely cited figure, but **does not appear in the abstract**; confirm in the full text | Trudel 2022 | ⚠️ |
| Iron | Hematocrit, serum iron and transferrin drop; ferritin rises | Smith 2005 | ✅ |

### Vision (SANS)

| Parameter | Value | Source | Status |
|---|---|---|---|
| Incidence | ~70% in astronauts on long missions | Laurie et al., *Evidence Report: Risk of SANS*, NASA HRP 2022 (cited in [Frontiers 2024](https://www.frontiersin.org/journals/ophthalmology/articles/10.3389/fopht.2024.1487992/full)) | ✅ |
| Probable cause | The shift of fluids toward the head | NASA Ensuring Astronaut Health | ✅ |

### Medications

| Parameter | Value | Source | Status |
|---|---|---|---|
| Stability | After 28 months on the ISS, 9 of 35 medications met the active-content standard (versus 17 on Earth); they degraded faster, probably due to radiation | Du et al., *AAPS J* 2011 — [DOI](https://doi.org/10.1208/s12248-011-9270-0) | ✅ |
| Implication | Record each medication's time in flight, not just its expiration date | — | — |

### Mental health

| Parameter | Value | Source | Status |
|---|---|---|---|
| Questionnaires used | BDI-II (depression), POMS (mood), conflicts, PVT-B (vigilance), stress and fatigue scales, weekly | Basner et al., *PLoS One* 2014 — [DOI](https://doi.org/10.1371/journal.pone.0093298) | ✅ (**analog**: Mars-500, 6 men, 520 days) |
| Finding | Large differences between people; one with depression symptoms 93% of weeks; two with no problems | Basner 2014 | ✅ |

### Long-Term Health Surveillance (OCHMO-TB-043)

Source: [NASA OCHMO-TB-043 Rev A, *Longitudinal Health Surveillance*, 05/12/2023](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-043-longitudinal-health-surveillance.pdf) — ✅ VERIFIED (provided by the team). Note: the PDF's footer says "OCHMO-TB-000"; the cover says TB-043 Rev A.

| Data point | Content |
|---|---|
| What it is | Medical procedures before, during and after the mission to protect health and document changes. Returning crew members must be monitored long-term for health, behavioral health and well-being |
| Changes it monitors | Vision, muscle and aerobic loss, nasal/head congestion, low back pain, fluid loss and orthostatic intolerance, genitourinary problems, bone loss and kidney stones, metabolic deficit, space adaptation syndrome, sensorimotor deconditioning |
| Vehicle factors | Radiation, CO₂, toxic chemicals and volatile organic compounds, pressure changes and decompression sickness |
| Eye exams | Before: L-21/18 months and/or L-9/6 months. **In flight: L+30, L+90, L+180, L+270 days and/or R-30**, or when needed. After: 1-3 days after landing |
| Laboratory | Before: L-90/30 days. After: R+0/1, R+3/7 (if needed) and R+14/30 |
| Functional fitness | L-6/9 months, L-90/30 days, R+5/7, R+30 |
| Isokinetic test (strength) | L-9/6 months, L-90/30 days, R+5, R+14, R+30 |
| Posturography | L-90/30 and R+8 |
| Radiation | Personal dosimetry in flight and afterward |
| Related law | TREAT Astronauts Act (2017): monitoring, diagnosis and occupational treatment for former astronauts; expanded the LSAH program |
| Sibling documents | OCHMO-TB-034 (selection), TB-006 (health stabilization), TB-033 (in-mission treatment) |

Key: L = launch, R = return. L-90/30 = between 90 and 30 days before launch.

**Rule for the app:** use this official calendar for reminders (for example, eye exam at L+30) and take the L-90/30 tests as the astronaut's **Earth baseline**.

### Communication with Earth

| Parameter | Value | Source | Status |
|---|---|---|---|
| Delay to the Moon | ~1.3 s one way | [Space Academy](https://www.spaceacademy.net.au/spacelink/commdly.htm) (physics; better to cite NASA) | ✅ |
| Delay to Mars | ~3 to 21 min one way | Space Academy | ✅ |

---

## 9. Datasets

### NASA (OSDR – Inspiration4)

| Dataset | Content | Status |
|---|---|---|
| OSD-569 | Whole blood | ⚠️ Confirm at osdr.nasa.gov |
| OSD-570 | Peripheral blood mononuclear cells (PBMC) | ⚠️ Confirm |
| OSD-571 | Plasma | ⚠️ Confirm |
| OSD-575 | Serum: full metabolic panel and immune/cardiac cytokines | ⚠️ Confirm |
| OSD-572 | Skin metagenomics (microbes). **Does NOT contain cardiac data** | ✅ |
| Apple Watch data (pulse, ECG) | They exist, but in **controlled-access repositories** (not public) | ✅ (Jones 2024) |

Programmatic access: `aws s3 ls --no-sign-request s3://nasa-osdr/` ([AWS Open Data](https://registry.opendata.aws/nasa-osdr/))

I4 data: only **processed** data is public; raw data (including genetic sequences) requires a request approved by a committee. Access guide: [Saravia-Butler et al., npj Microgravity 2024](https://www.nature.com/articles/s41526-024-00393-5.pdf).

### NASA: Other Open Data (added in version 2)

| Dataset | Parameters | Access | Status |
|---|---|---|---|
| OSDR RadLab + API | 3 Radiation | Open | ✅ (details in section 3) |
| OSDR Environmental Data App | 3 Radiation, cabin environment | Open | ✅ (details in section 3) |
| NLSP bed rest UTMB C1, C3, CFT70, MR035G, MR079G | 7 Muscle and bone; 2 and 6 cardiovascular | Open | ✅ (details in section 7) |
| [NASA Life Sciences Portal (NLSP)](https://nlsp.nasa.gov/explore/mtable/lsda_dataset/lsda_dataset) | LSDA catalog since 1961 (ISS, Shuttle, bed rest) | Public catalog; much data by request | ⚠️ |

### Partner Agencies and Universities

| Dataset | Parameters | Access | Status |
|---|---|---|---|
| [ESA/MEDES bed rest (University of Bath)](https://researchportal.bath.ac.uk/en/datasets/data-from-the-impact-of-long-term-physical-inactivity-on-adipose-/) | 1 Metabolism: continuous glucose (5 days before and at the end), 24-h urinary glucose, baseline characteristics | Open (check license) | ✅ Analog, men aged 20-45 |
| Polaris Dawn, ESA, Virgin Galactic in OSDR | To be confirmed | Announced as "coming soon" in January 2025 | ⚠️ Search osdr.nasa.gov |
| JAXA human data in OSDR | To be confirmed | Reported as published | ⚠️ Search osdr.nasa.gov |

### They exist, but CANNOT be used today

| Dataset | Why not | Status |
|---|---|---|
| CSA Bio-Monitor (Astroskin): 9 astronauts, 48-h recordings of sleep, fitness and pressure | Private data analyzed under a grant; not downloadable | ❌ |
| HERA with Astroskin (9 men, 7 women, 24-h monitoring) | By request to LSDA ([NTRS 20190001996](https://ntrs.nasa.gov/citations/20190001996)) | ⚠️ |
| NASA Twins Study | By request to LSDA | ⚠️ |
| LSAH / Standard Measures | Request with ethics committee approval | ⚠️ |
| ESA Bedrest Core Data | Only through a call for proposals (closed) | ❌ |

### Other Real Public Data

| Dataset | Content | Use |
|---|---|---|
| [Blood Pressures In Spaceflight (Mendeley)](https://data.mendeley.com/datasets/pz6nt4cpxs) | Summarized blood pressure from studies and from the astronaut health database | Pressure ranges |
| Kaggle `canaria/5-gamers` | Pulse (PPG ~100 Hz) of 5 people over 22 h, hourly sleepiness, reaction times | Fatigue predictor |
| Kaggle `qiriro/swell-heart-rate-variability-hrv` | Heart rate variability of 25 people with and without stress (CC0) | Stress predictor |
| Kaggle `nasa/astronaut-yearbook` and `nasa/space-walking-russian-and-us-evas` | Astronauts, hours in space and spacewalks (official NASA account) | Profiles and calendar |
| Kaggle `virajbijpuria/all-space-biology-publications-2010-2025` | Space biology publications (SQLite; AGPL license) | Documents for the AI doctor |
| HRV + sleep diaries (*Scientific Data* 2025) | 49 people, 4 weeks: pulse, variability, sleep, anxiety, depression | Fatigue and mood |
| BiHeartS | 10 people, 30 nights of sleep and pulse | Sleep |
| [PhysioNet BIDSleep](https://www.physionet.org/content/bidsleep-dataset/) | Apple Watch pulse + EEG sleep stages | Realistic shape of nighttime pulse |
| Kaggle `arashnic/fitbit` | 30 Fitbit users: activity, pulse, sleep (CC0) | Activity data |

### ❌ Discarded Datasets (do not use as real data)

| Dataset | Reason |
|---|---|
| Kaggle `khushichhabadia/astronaut-health-dataset` | 6 KB, no source, unknown license |
| Kaggle `gastondana/osd-679-sans...` | Mentions "strains": probably mouse data |
| Kaggle `uom190346a/sleep-and-health-metrics` | Synthetic |
| Kaggle `arnavsmayan/fitness-tracker-dataset` | Synthetic |
| Kaggle Whoop, Athlete Recovery, E-Sports Biometrics | Labeled as synthetic |
| Kaggle `corot7b/orbit-pk...` (medications) | Synthetic, non-commercial license |
| Kaggle `theblank629/astronaut-health-datasets` ("blood") | Mix of BIDMC, WESAD and faces from AffectNet/FER2013 (possible license violation); "NASA_Radiation_processed" has no source |
| Kaggle `theblank629/astronaut-health-data-v2` | Merged CSVs with unclear origin and `.pt` files |

⚠️ **Security:** do not open `.pt` files from unknown sources with `torch.load` (they can execute code). Delete them if already downloaded. BIDMC and WESAD are real: download them from their official sources (PhysioNet and UCI).

---

## 10. Errors Found in Earlier Research (do not use)

| Claim | Problem |
|---|---|
| "OSD-572 contains Apple Watch pulse and HRV" | ❌ False: OSD-572 is skin metagenomics |
| "F = 37.10 and F = 5.64 correlated with CO₂" | ❌ Wrongly attributed: they are changes **between mission phases**. The relationship with CO₂ is a different finding |
| "Pulse F = 37.10, P = 0.0019" | ❌ Altered citation: the article says **P < 0.0001** |
| "80-160 mSv per 6-month mission" | ❌ Unsupported. The verified figure is ~40-90 mSv |
| "0.5 to 1.3 mSv/day on the ISS" | ❌ Mixes data: 1.3 mSv/day is a proposed deep-space design limit |
| "Sleep efficiency −17.7%, REM −25.8% on the ISS" | ⚠️ It is from Mir with 5 people, not from the ISS |
| "CO₂ limit cited to the Inspiration4 article" | ⚠️ The figure is correct, but the source is NASA-STD-3001 |
| "Anemia +54%" cited to a news page | ⚠️ The primary source is Trudel 2022; the exact figure still needs confirmation |
| "Resting pulse rises week after week in flight" | ❌ In flight it does not change; it rises on return |

---

## 11. Pending Gaps

| Topic | Situation |
|---|---|
| Oxygenation (SpO₂) on long flights | No published data; I4 measured it but it is controlled-access. Use clinical range (≥95%) |
| Flight surgeon thresholds | Not public. Use clinical ranges + NASA-STD-3001 + personal baseline |
| Glucose with numerical values | In flight only the direction was confirmed (insulin resistance rises). There is continuous glucose from an analog in the ESA/MEDES dataset (Bath) |
| Body temperature | No individual public data; the Environmental Data App is cabin temperature, not body temperature |
| Sleep in flight | No public individual data; only figures from articles |
| Clinical ranges on Earth | Cite from the official AHA pages (normal pressure <120/80) and ADA (fasting glucose <100 mg/dL) |
| Bone loss curve over time | Not characterized in flight for 6+ months. There is a 70-day analog curve (NLSP MR035G, CFT70) |

---

## 12. Note on Using This to Train or Feed Models

- This file is a **summary with sources**, not the original documents. For the AI doctor's document search, it is advisable to also load the original texts.
- NASA documents (NTRS, nasa.gov) are usually public use. Journal articles have **different licenses**: check each one before redistributing them or using them for training.
- For training, use only data marked ✅. Those marked ⚠️ can serve as context, always labeled as uncertain.

---

## 13. PDFs for Training or Loading into the AI Doctor

Direct links to PDFs. The number in the table is the file name generated by the download command below (01.pdf, 02.pdf…).

| # | Document | Topic | License |
|---|---|---|---|
| 01 | [JSC-67378, Nutritional Requirements for Exploration Missions](https://ntrs.nasa.gov/api/citations/20205008306/downloads/JSC67378%20Expl%20Nutr%20Reqs%20042020.pdf) | 1 Intake | NASA, public use |
| 02 | [NTRS 20060049121, nutrition on the ISS](https://ntrs.nasa.gov/api/citations/20060049121/downloads/20060049121.pdf) | 1 Intake | NASA, public use |
| 03 | [OCHMO-TB-002, ECLSS](https://www.nasa.gov/wp-content/uploads/2023/07/eclss-technical-brief-ochmo.pdf) | 1 Intake, environment | NASA, public use |
| 04 | [Simonsen et al., radiation (NTRS 20250006168)](https://ntrs.nasa.gov/api/citations/20250006168/downloads/ASCEND%20Simonsen%20draft%201.pdf) | 3 Radiation | NASA, public use |
| 05 | [OCHMO Standards Overview](https://www.nasa.gov/wp-content/uploads/2021/09/ochmo_standards_overview_sept_15_2021_francisco.pdf) | 3 Limits | NASA, public use |
| 06 | [OCHMO, radiation protection](https://www.nasa.gov/sites/default/files/atoms/files/radiation_protection_technical_brief_ochmo.pdf) | 3 Radiation | NASA, public use |
| 07 | [OCHMO-TB-030 Rev C, bone loss](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-030-bone-loss.pdf) | 7 Bone | NASA, public use |
| 08 | [NTRS 20170004597, bone loss curve](https://ntrs.nasa.gov/api/citations/20170004597/downloads/20170004597.pdf) | 7 Bone | NASA, public use |
| 09 | [NTRS 20230004166, ARED/T2/CEVIS exercise](https://ntrs.nasa.gov/api/citations/20230004166/downloads/Varanoske_ACSM%202023%20Poster_Final%20H-3PO.pptx.pdf) | 7 Exercise | NASA, public use |
| 10 | [npj Microgravity 2023, exercise loads](https://www.nature.com/articles/s41526-023-00256-5.pdf) | 7 Exercise | Open access (check license) |
| 11 | [OCHMO-TB-004, CO₂](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf) | Environment | NASA, public use |
| 12 | [OCHMO-TB-043, long-term surveillance](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-043-longitudinal-health-surveillance.pdf) | Exam calendar | NASA, public use |
| 13 | [IWS 2026, "tidy" bed rest data](https://ntrs.nasa.gov/api/citations/20260002548/downloads/IWS_Tidy_Data_Presentation_Update.pdf) | 7 Datasets | NASA, public use |
| 14 | [HERA with Astroskin (NTRS 20190001996)](https://ntrs.nasa.gov/api/citations/20190001996/downloads/20190001996.pdf) | 2, 4 Wearables | NASA, public use |
| 15 | [I4 data guide in OSDR (npj Microgravity 2024)](https://www.nature.com/articles/s41526-024-00393-5.pdf) | Datasets | Open access (check license) |
| 16 | [OSDR, HRP IWS 2024](https://ntrs.nasa.gov/api/citations/20230014168/downloads/scott_Open%20Science%20Data%20Respository%20hrpiws2024.pdf) | Datasets | NASA (may include copyrighted material) |
| 17 | [OSDR Beyond FAIR, IWS 2025](https://ntrs.nasa.gov/api/citations/20240012312/downloads/scott_OSDR_BeyondFAIR_IWS25.pdf) | Datasets | NASA, public use |
| 18 | [AGBRESA protocol (Frontiers 2022)](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2022.976926/pdf) | Analog, various | CC BY |
| 19 | [Artificial gravity and autonomic control (Frontiers 2023)](https://www.frontiersin.org/journals/cardiovascular-medicine/articles/10.3389/fcvm.2023.1250727/pdf) | 2, 6 Cardiovascular | CC BY |
| 20 | [NASA Standard Measures Overview 2008](https://ntrs.nasa.gov/api/citations/20080013330/downloads/20080013330.pdf) | Analog | NASA, public use |
| 21 | [VIVALDI, dry immersion in women (Nature Comms 2023)](https://hal.inrae.fr/hal-04482295v1/document) | Analog, various | Open access (check license) |
| 22 | [OCHMO-TB-031, Exercise Overview](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-031-exercise-overview.pdf) | 7 Exercise, requirements | NASA, public use |
| 23 | [IMPACT 1.0 Medical Condition List (Kreykes 2023)](https://meridian-asma-published.prime-prod-local.pubfactory.com/downloadpdf/view/journals/amhp/94/7/article-p550.pdf) | Condition catalog | Journal (check license) |
| 24 | [Integrated Medical Model, summary (100 conditions)](https://ntrs.nasa.gov/api/citations/20150002713/downloads/20150002713.pdf) | Condition catalog | NASA, public use |
| 25 | [ExMC Medical Condition List (2009)](https://ntrs.nasa.gov/api/citations/20100028273/downloads/20100028273.pdf) | Condition catalog | NASA, public use |
| 26 | [Condition List for Mars Transit](https://ntrs.nasa.gov/api/citations/20190025913/downloads/20190025913.pdf) | Condition catalog | NASA, public use |

Open-access articles without a direct PDF (download from the page): Jones et al., *Sleep* 2022 ([PMC8919197](https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197/)); bone health standard ([PMC6418107](https://pmc.ncbi.nlm.nih.gov/articles/PMC6418107)); Jones et al., *Nature* 2024 ([DOI](https://doi.org/10.1038/s41586-024-07648-x)).

### Quick Download (PowerShell on Windows)

Saves the 26 PDFs in a `pdfs_nasa` folder on the Desktop.

```powershell
$urls = @(
"https://ntrs.nasa.gov/api/citations/20205008306/downloads/JSC67378%20Expl%20Nutr%20Reqs%20042020.pdf",
"https://ntrs.nasa.gov/api/citations/20060049121/downloads/20060049121.pdf",
"https://www.nasa.gov/wp-content/uploads/2023/07/eclss-technical-brief-ochmo.pdf",
"https://ntrs.nasa.gov/api/citations/20250006168/downloads/ASCEND%20Simonsen%20draft%201.pdf",
"https://www.nasa.gov/wp-content/uploads/2021/09/ochmo_standards_overview_sept_15_2021_francisco.pdf",
"https://www.nasa.gov/sites/default/files/atoms/files/radiation_protection_technical_brief_ochmo.pdf",
"https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-030-bone-loss.pdf",
"https://ntrs.nasa.gov/api/citations/20170004597/downloads/20170004597.pdf",
"https://ntrs.nasa.gov/api/citations/20230004166/downloads/Varanoske_ACSM%202023%20Poster_Final%20H-3PO.pptx.pdf",
"https://www.nature.com/articles/s41526-023-00256-5.pdf",
"https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf",
"https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-043-longitudinal-health-surveillance.pdf",
"https://ntrs.nasa.gov/api/citations/20260002548/downloads/IWS_Tidy_Data_Presentation_Update.pdf",
"https://ntrs.nasa.gov/api/citations/20190001996/downloads/20190001996.pdf",
"https://www.nature.com/articles/s41526-024-00393-5.pdf",
"https://ntrs.nasa.gov/api/citations/20230014168/downloads/scott_Open%20Science%20Data%20Respository%20hrpiws2024.pdf",
"https://ntrs.nasa.gov/api/citations/20240012312/downloads/scott_OSDR_BeyondFAIR_IWS25.pdf",
"https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2022.976926/pdf",
"https://www.frontiersin.org/journals/cardiovascular-medicine/articles/10.3389/fcvm.2023.1250727/pdf",
"https://ntrs.nasa.gov/api/citations/20080013330/downloads/20080013330.pdf",
"https://hal.inrae.fr/hal-04482295v1/document",
"https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-031-exercise-overview.pdf",
"https://meridian-asma-published.prime-prod-local.pubfactory.com/downloadpdf/view/journals/amhp/94/7/article-p550.pdf",
"https://ntrs.nasa.gov/api/citations/20150002713/downloads/20150002713.pdf",
"https://ntrs.nasa.gov/api/citations/20100028273/downloads/20100028273.pdf",
"https://ntrs.nasa.gov/api/citations/20190025913/downloads/20190025913.pdf"
)
$dir = Join-Path ([Environment]::GetFolderPath("Desktop")) "pdfs_nasa"
New-Item -ItemType Directory -Force $dir | Out-Null
$i = 1
foreach ($u in $urls) {
  $out = Join-Path $dir ("{0:D2}.pdf" -f $i)
  try { Invoke-WebRequest $u -OutFile $out -UseBasicParsing; Write-Host "OK $i" } catch { Write-Host "FAILED $i $u" }
  $i++
}
```

---

## 14. Coverage per Parameter (what can be trained today)

```
Parameter          Real data available                            Level   What to do
1 Intake/kcal      EER equations (NASA) + ESA/Bath glucose        ▓▓░░░   Code rules (EER)
2 Heart rate       UTMB (analog) + SWELL/BIDMC (Earth)            ▓▓▓░░   HRV/fatigue model
3 Radiation        RadLab API + EDA (real flight)                 ▓▓▓▓▓   Trained model
4 Sleep            Articles + Earth datasets                      ▓░░░░   Rules (≤6 h)
5 Body temp.       None (EDA is the cabin)                        ░░░░░   Rules (baseline +1 °C)
6 Pressure         UTMB (analog) + Mendeley BP in Spaceflight     ▓▓▓░░   Rules + ranges
7 Muscle/bone      UTMB C1/C3, CFT70, MR035G, MR079G              ▓▓▓▓░   Risk model (analog)
```

Rule: where there is no real data (sleep in flight, temperature), use **code rules** with the thresholds from the articles, not a "trained" model with invented data.

