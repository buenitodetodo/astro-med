# Datasets and databases for the project

**Date:** November 14, 2026
**Status:** links found; the team reviews each one before using it.

## 1. Catalog of medical conditions (NASA) — priority

| Source | What it is | Link |
|---|---|---|
| IMPACT 1.0 Condition List (Kreykes et al., *Aerosp Med Hum Perform* 2023) | 120 conditions for a 210-day mission (cislunar/Mars) | [PDF](https://meridian-asma-published.prime-prod-local.pubfactory.com/downloadpdf/view/journals/amhp/94/7/article-p550.pdf) |
| Integrated Medical Model (IMM) | 100 conditions (47 have already happened, 53 are possible). Each with incidence, duration, resources to treat it and probability of escalation | [NTRS 20150002713](https://ntrs.nasa.gov/api/citations/20150002713/downloads/20150002713.pdf) |
| ExMC Medical Condition List | ~80 conditions approved in July 2009, ranked by incidence, consequence and mitigation | [NTRS 20100028273](https://ntrs.nasa.gov/api/citations/20100028273/downloads/20100028273.pdf) |
| Condition List for Mars Transit | Cites the ISS Medical Checklist (JSC-48522) and Watkins' full list (NASA/TP-2010-216118) | [NTRS 20190025913](https://ntrs.nasa.gov/api/citations/20190025913/downloads/20190025913.pdf) |
| Developing a New Medical Condition List | Describes ICL 1.0 | [NTRS 20205008590](https://ntrs.nasa.gov/citations/20205008590) |

## 2. Medical text to train or evaluate the AI doctor

| Dataset | Link | Note |
|---|---|---|
| MedQA (USMLE) | [Kaggle](https://www.kaggle.com/datasets/evidence/medqa-usmle) · [HF GBaker/MedQA-USMLE-4-options](https://huggingface.co/datasets/GBaker/MedQA-USMLE-4-options) | Best for evaluation |
| MedMCQA (~194 thousand questions) | [Official HF](https://huggingface.co/datasets/medmcqa) | Best for evaluation |
| MedInstruct-52K | HF `lavita/AlpaCare-MedInstruct-52k` | Medical instructions |
| ChatDoctor-HealthCareMagic-100k | HF `lavita/ChatDoctor-HealthCareMagic-100k` | ⚠️ Comes from a forum; variable quality |
| Clinical guidelines (EPFL) | [HF epfl-llm/guidelines](https://huggingface.co/datasets/epfl-llm/guidelines) | For document search |
| MedQuAD (CC BY-SA) | [Kaggle](https://www.kaggle.com/datasets/pythonafroz/medquad-medical-question-answer-for-ai-research) | |
| Comprehensive Medical Q&A (CC0) | [Kaggle](https://www.kaggle.com/datasets/thedevastator/comprehensive-medical-q-a-dataset) | |
| Healthcare NLP (collection) | [Kaggle](https://www.kaggle.com/datasets/jpmiller/layoutlm) | |
| All medical datasets on HF | [Filter](https://huggingface.co/datasets?other=medical) | |

## 3. Real vital signs

| Dataset | Contents | Link |
|---|---|---|
| Pulse Transit Time PPG | 22 healthy people, 3 activities: PPG, sensor temperature, IMU, ECG; blood pressure and SpO₂. ODbL | `aws s3 ls --no-sign-request s3://physionet-open/pulse-transit-time-ppg/` |
| Auricle (Oct 2026) | 42 healthy people + 28 with heart failure: ECG, PPG, continuous blood pressure, respiration | [PhysioNet](https://physionet.org/content/auricle/1.0.0/) |
| CardioWave-Portable | ECG + PPG + blood pressure. ⚠️ Credentialed access | [PhysioNet](https://physionet.org/content/cardiowave-portable/1.0.0/) |
| MIT-BIH Arrhythmia (CSV) | ECG from 47 patients | [Kaggle](https://www.kaggle.com/datasets/protobioengineering/mit-bih-arrhythmia-database-modern-2023) |
| ECG Heartbeat Categorization | Segmented heartbeats | [Kaggle](https://www.kaggle.com/datasets/shayanfazeli/heartbeat) |
| PTB-XL atrial fibrillation (CC BY 4.0) | Normal / AF / other | [Kaggle](https://www.kaggle.com/datasets/arjunascagnetto/ptbxl-atrial-fibrillation-detection) |
| Sleep stages (IMU + PPG) | Small, Apache 2.0 | [Kaggle](https://www.kaggle.com/datasets/moaaz014/sleep-stages-detection) |

## 4. Nutrition

| Dataset | Link |
|---|---|
| USDA FoodData Central (official) | [fdc.nal.usda.gov](https://fdc.nal.usda.gov/) |
| ~8,800 foods (CC0) | [Kaggle](https://www.kaggle.com/datasets/trolukovich/nutritional-values-for-common-foods-and-products) |
| Global Food & Nutrition 2026 (45 thousand) | [Kaggle](https://www.kaggle.com/datasets/ahsanneural/global-food-and-nutrition-database-2026) |

## ❌ Do not use (synthetic or without a source)

- `pallachetanareddy/icu-patient-vitals-monitoring-dataset` (declares itself synthetic)
- `deeplumiere/patient-clinical-records-readmission-risk-dataset` (declares itself synthetic)
- `mftnakrsu/health-wearables-stresssleep-tracking-syntc` (synthetic)
- `nudratabbas/icu-vitals-time-series-messy-and-irregular`, `ziya07/wearable-sports-health-monitoring-dataset`, `omenkj/iot-health-monitoring-dataset` (no clear source)
