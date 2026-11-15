# Research: data that had no source

Date: November 15, 2026. Closes the list of numbers that the design or the code used without a verified source.

## How to read this document

| Mark | Meaning |
|---|---|
| ✅ | Seen in the original source (article, PubMed abstract or NASA document) |
| ⚠️ | Seen only in a search summary or a secondary source: open the original before citing it in the presentation |
| ❌ | There is no source: it is a team decision or it has to be removed |

---

## 1. Numbers that now have a source

| Data in the project | What the source says | Source | Status |
|---|---|---|---|
| Atwater factors 4 / 9 / 4 kcal/g (protein, fat, carbohydrate) | General factors derived from Atwater's work; they give a satisfactory measure for average diets, with limits for individual foods | Merrill and Watt, *Energy Value of Foods: Basis and Derivation*, USDA Agriculture Handbook 74 (1955, rev. 1973) — [USDA copy](https://ars.usda.gov/ARSUSERFILES/80400535/DATA/CLASSICS/USDA%20HANDBOOK%2074.PDF) | ⚠️ (title and contents seen in the summary; open the PDF) |
| 12-minute delay to Earth | Mars: 3 to 22 minutes one way depending on distance. A JPL report gives ~25 minutes round trip on average, which is ~12.5 minutes one way | [NTRS 20220013418](https://ntrs.nasa.gov/api/citations/20220013418/downloads/ASCEND-Communication%20Delays,%20Disruptions,%20and%20Blackouts%20for%20Crewed%20Mars%20Missions.pdf); [JPL IPN PR 42-237A](https://ipnpr.jpl.nasa.gov/progress_report/42-237/42-237A.pdf) | ⚠️ |
| Detecting illness from deviation from the personal baseline | With consumer smartwatches, 26 of 32 COVID-19 cases showed changes; 63% could have been detected before symptoms with alerts on extreme rises of resting heart rate relative to the individual baseline | Mishra et al., *Nat Biomed Eng* 2020 (PubMed) — [DOI](https://doi.org/10.1038/s41551-020-00640-6) | ✅ |
| Real-time alerts on changes from the baseline | Alerts in 78% of presymptomatic and asymptomatic cases, a median of 3 days before symptoms. Other events (stress, alcohol, travel) also trigger them | Alavi et al., medRxiv 2021 (PubMed, **preprint**) — [DOI](https://doi.org/10.1101/2021.06.13.21258795) | ✅ |
| Fever relative to the baseline | Fever = one oral reading > 37.8 °C, or repeated > 37.2 °C, or a **rise of more than 1.1 °C over the baseline** | High et al., IDSA guideline, *J Am Geriatr Soc* 2009 — [PubMed 19278394](https://pubmed.ncbi.nlm.nih.gov/19278394/) | ⚠️ (population: older adults in long-term care, not astronauts) |
| ARED sets and repetitions | Sprint protocol (3 days/week): 4 sets of 12, 8 or 6 repetitions depending on the day, the fourth set near maximal. Control (6 days/week): squat, deadlift and heel raises daily; heel raises 4 × 20; load at 70% of the maximum, +5% per week | English et al., *npj Microgravity* 2020 — [PMC7434884](https://pmc.ncbi.nlm.nih.gov/articles/PMC7434884) | ✅ |
| Voting over several runs of the model | Sampling several answers and keeping the majority improves accuracy (for example +17.9% on GSM8K) | Wang et al., *Self-Consistency Improves Chain of Thought Reasoning*, ICLR 2023 — [arXiv 2203.11171](https://arxiv.org/abs/2203.11171) | ⚠️ |
| QT interval on long flights | There is a NASA study on QTc in short and long flights; a 2024 review says long flights are associated with QT prolongation | D'Aunno et al., *Am J Cardiol* 2003 (PubMed, no abstract) — [DOI](https://doi.org/10.1016/s0002-9149(02)03259-9); Hussain et al., *Health Sci Rep* 2024 — [DOI](https://doi.org/10.1002/hsr2.2305) | ⚠️ (no figures seen) |
| Crew health index | NASA's Integrated Medical Model has an output called *Crew Health Index* (functional capacity of the crew), together with the probability of evacuation and of loss of life. Its formula was not found | [NASA IMM](https://www.nasa.gov/general/nasas-integrated-medical-model-imm/) | ⚠️ |

## 2. What to do with each pending item

| Pending item | Conclusion | Action |
|---|---|---|
| Health index and crew scores (design) | NASA has a *Crew Health Index*, but it is the output of a probabilistic model, not a daily score, and its formula is not public | ❌ Do not invent a score. Keep showing "nominal parameters out of those with data" |
| Bone and muscle risk in % | Already documented in `01` (bone loss of 1–2% per month in spine and hip, OCHMO-TB-030) | ✅ The simulator shows it as an estimate, with its source |
| Live ECG (sinus rhythm, QTc) | There is literature, but the app has no ECG sensor | ❌ Leave it as "no data" |
| Sleep stages | In `01`: only 5 people on Mir. It requires polysomnography or actigraphy | ❌ Leave it as "no data" |
| 1.0 mSv daily radiation limit | In `01`: NASA only has daily limits "under consideration" (<1.3 mSv/day), not approved. What is measured on the ISS is ~0.2–0.5 mSv/day | ❌ Do not show a daily limit. Use the career limit (600 mSv) and the solar storm limit (250 mSv), as the app already does |
| Suggested meal and exercise times | `01` only has the allocated time (2.5 h/day of exercise, 6–7 days). No official schedule was found | ❌ Do not show schedules |
| ARED sets and repetitions | Row above (English 2020) | ✅ Can be shown, citing the protocol |
| Atwater factors | Row above | ✅ Source added in the code |
| Ration values | They are fictional and labeled as such | ❌ They remain demo values |
| 12-minute delay | Row above: 12 minutes is the approximate average | ✅ |

## 3. Team decisions that still have no source (and why)

| Decision | Value | What supports the method | What has no support |
|---|---|---|---|
| Alert on deviation from the personal baseline | 2 standard deviations | Mishra 2020 and Alavi 2021 use deviations from the individual baseline | The "2" and the 5 minimum readings are our choice |
| Minimum margin | 5 bpm, 8 ms, 0.3 °C | Avoids alerts for differences smaller than the sensor's precision | The three numbers. The IDSA guideline uses +1.1 °C for fever: our 0.3 °C is an **early warning**, not a fever criterion |
| Out-of-range days left out of the baseline | — | Without it a long fever "disappears" (shown in the simulator) | Our rule |
| 3 days of deficit for red | 3 | — | Our decision |
| Proposal A | 8/10 high, 6/10 medium | Wang 2022 supports voting over several runs | The thresholds, and using agreement as confidence: it is not calibrated |
| Follow-up check | at most 1 | — | Design rule |
| Simulator baseline | simulated per astronaut | — | It does not come from a medical record |

## 4. For the presentation

Saying it this way is stronger than hiding it: the **requirements and limits** come from NASA documents and peer-reviewed articles; the **alert method** (deviation from the personal baseline) has published support; the **exact thresholds** are team decisions, labeled as such in the app itself, and would need to be validated with real data.
