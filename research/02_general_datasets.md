# Datasets y bases de datos para el proyecto en general

**Fecha:** 14 de noviembre de 2026
**Estado:** links encontrados; el equipo los revisa antes de usarlos.

## 1. Catálogo de condiciones médicas (NASA) — prioridad

| Fuente | Qué es | Link |
|---|---|---|
| IMPACT 1.0 Condition List (Kreykes et al., *Aerosp Med Hum Perform* 2023) | 120 condiciones para una misión de 210 días (cislunar/Marte) | [PDF](https://meridian-asma-published.prime-prod-local.pubfactory.com/downloadpdf/view/journals/amhp/94/7/article-p550.pdf) |
| Integrated Medical Model (IMM) | 100 condiciones (47 ya ocurrieron, 53 posibles). Cada una con incidencia, duración, recursos para tratarla y probabilidad de escalar | [NTRS 20150002713](https://ntrs.nasa.gov/api/citations/20150002713/downloads/20150002713.pdf) |
| ExMC Medical Condition List | ~80 condiciones aprobadas en julio de 2009, priorizadas por incidencia, consecuencia y mitigación | [NTRS 20100028273](https://ntrs.nasa.gov/api/citations/20100028273/downloads/20100028273.pdf) |
| Condition List for Mars Transit | Cita el ISS Medical Checklist (JSC-48522) y la lista completa de Watkins (NASA/TP-2010-216118) | [NTRS 20190025913](https://ntrs.nasa.gov/api/citations/20190025913/downloads/20190025913.pdf) |
| Developing a New Medical Condition List | Describe la ICL 1.0 | [NTRS 20205008590](https://ntrs.nasa.gov/citations/20205008590) |

## 2. Texto médico para entrenar o evaluar al doctor IA

| Dataset | Link | Nota |
|---|---|---|
| MedQA (USMLE) | [Kaggle](https://www.kaggle.com/datasets/evidence/medqa-usmle) · [HF GBaker/MedQA-USMLE-4-options](https://huggingface.co/datasets/GBaker/MedQA-USMLE-4-options) | Mejor para evaluar |
| MedMCQA (~194 mil preguntas) | [HF oficial](https://huggingface.co/datasets/medmcqa) | Mejor para evaluar |
| MedInstruct-52K | HF `lavita/AlpaCare-MedInstruct-52k` | Instrucciones médicas |
| ChatDoctor-HealthCareMagic-100k | HF `lavita/ChatDoctor-HealthCareMagic-100k` | ⚠️ Viene de un foro; calidad variable |
| Guías clínicas (EPFL) | [HF epfl-llm/guidelines](https://huggingface.co/datasets/epfl-llm/guidelines) | Para búsqueda de documentos |
| MedQuAD (CC BY-SA) | [Kaggle](https://www.kaggle.com/datasets/pythonafroz/medquad-medical-question-answer-for-ai-research) | |
| Comprehensive Medical Q&A (CC0) | [Kaggle](https://www.kaggle.com/datasets/thedevastator/comprehensive-medical-q-a-dataset) | |
| Healthcare NLP (colección) | [Kaggle](https://www.kaggle.com/datasets/jpmiller/layoutlm) | |
| Todos los médicos de HF | [Filtro](https://huggingface.co/datasets?other=medical) | |

## 3. Señales vitales reales

| Dataset | Contenido | Link |
|---|---|---|
| Pulse Transit Time PPG | 22 sanos, 3 actividades: PPG, temperatura de sensores, IMU, ECG; presión y SpO₂. ODbL | `aws s3 ls --no-sign-request s3://physionet-open/pulse-transit-time-ppg/` |
| Auricle (oct 2026) | 42 sanos + 28 con insuficiencia cardiaca: ECG, PPG, presión continua, respiración | [PhysioNet](https://physionet.org/content/auricle/1.0.0/) |
| CardioWave-Portable | ECG + PPG + presión. ⚠️ Acceso con credenciales | [PhysioNet](https://physionet.org/content/cardiowave-portable/1.0.0/) |
| MIT-BIH Arrhythmia (CSV) | ECG de 47 pacientes | [Kaggle](https://www.kaggle.com/datasets/protobioengineering/mit-bih-arrhythmia-database-modern-2023) |
| ECG Heartbeat Categorization | Latidos segmentados | [Kaggle](https://www.kaggle.com/datasets/shayanfazeli/heartbeat) |
| PTB-XL fibrilación auricular (CC BY 4.0) | Normal / FA / otras | [Kaggle](https://www.kaggle.com/datasets/arjunascagnetto/ptbxl-atrial-fibrillation-detection) |
| Etapas de sueño (IMU + PPG) | Pequeño, Apache 2.0 | [Kaggle](https://www.kaggle.com/datasets/moaaz014/sleep-stages-detection) |

## 4. Nutrición

| Dataset | Link |
|---|---|
| USDA FoodData Central (oficial) | [fdc.nal.usda.gov](https://fdc.nal.usda.gov/) |
| ~8,800 alimentos (CC0) | [Kaggle](https://www.kaggle.com/datasets/trolukovich/nutritional-values-for-common-foods-and-products) |
| Global Food & Nutrition 2026 (45 mil) | [Kaggle](https://www.kaggle.com/datasets/ahsanneural/global-food-and-nutrition-database-2026) |

## ❌ No usar (sintéticos o sin fuente)

- `pallachetanareddy/icu-patient-vitals-monitoring-dataset` (se declara sintético)
- `deeplumiere/patient-clinical-records-readmission-risk-dataset` (se declara sintético)
- `mftnakrsu/health-wearables-stresssleep-tracking-syntc` (sintético)
- `nudratabbas/icu-vitals-time-series-messy-and-irregular`, `ziya07/wearable-sports-health-monitoring-dataset`, `omenkj/iot-health-monitoring-dataset` (sin fuente clara)
