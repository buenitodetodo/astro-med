# Investigación: datos que estaban sin fuente

Fecha: 15 de noviembre de 2026. Cierra la lista de números que el diseño o el código usaban sin fuente verificada.

## Cómo leer este documento

| Marca | Significado |
|---|---|
| ✅ | Visto en la fuente original (artículo, resumen de PubMed o documento de la NASA) |
| ⚠️ | Visto solo en un resumen de búsqueda o en una fuente secundaria: abrir el original antes de citarlo en la presentación |
| ❌ | No existe fuente: es decisión del equipo o hay que quitarlo |

---

## 1. Números que ya tienen fuente

| Dato en el proyecto | Qué dice la fuente | Fuente | Estado |
|---|---|---|---|
| Factores de Atwater 4 / 9 / 4 kcal/g (proteína, grasa, carbohidrato) | Son los factores generales derivados del trabajo de Atwater; dan una medida satisfactoria en dietas promedio, con límites para alimentos individuales | Merrill y Watt, *Energy Value of Foods: Basis and Derivation*, USDA Agriculture Handbook 74 (1955, rev. 1973) — [copia del USDA](https://ars.usda.gov/ARSUSERFILES/80400535/DATA/CLASSICS/USDA%20HANDBOOK%2074.PDF) | ⚠️ (título y contenido vistos en el resumen; abrir el PDF) |
| Retraso de 12 min a la Tierra | Marte: de 3 a 22 min de ida según la distancia. Un reporte de JPL da ~25 min de ida y vuelta en promedio, es decir ~12.5 min de ida | [NTRS 20220013418](https://ntrs.nasa.gov/api/citations/20220013418/downloads/ASCEND-Communication%20Delays,%20Disruptions,%20and%20Blackouts%20for%20Crewed%20Mars%20Missions.pdf); [JPL IPN PR 42-237A](https://ipnpr.jpl.nasa.gov/progress_report/42-237/42-237A.pdf) | ⚠️ |
| Detectar enfermedad por desviación de la línea base personal | Con relojes de consumo, 26 de 32 casos de COVID-19 mostraron alteraciones; 63% se habría detectado antes de los síntomas con alertas por elevación extrema del pulso en reposo respecto a la línea base individual | Mishra et al., *Nat Biomed Eng* 2020 (PubMed) — [DOI](https://doi.org/10.1038/s41551-020-00640-6) | ✅ |
| Alertas en tiempo real por cambios respecto a la línea base | Alertas en 78% de los casos presintomáticos y asintomáticos, mediana de 3 días antes de los síntomas. También disparan otros eventos (estrés, alcohol, viajes) | Alavi et al., medRxiv 2021 (PubMed, **preprint**) — [DOI](https://doi.org/10.1101/2021.06.13.21258795) | ✅ |
| Fiebre relativa a la línea base | Fiebre = una lectura oral > 37.8 °C, o repetidas > 37.2 °C, o **aumento > 1.1 °C sobre la línea base** | High et al., guía IDSA, *J Am Geriatr Soc* 2009 — [PubMed 19278394](https://pubmed.ncbi.nlm.nih.gov/19278394/) | ⚠️ (población: adultos mayores en asilos, no astronautas) |
| Series y repeticiones del ARED | Protocolo Sprint (3 días/semana): 4 series de 12, 8 o 6 repeticiones según el día, la cuarta serie casi al máximo. Control (6 días/semana): sentadilla, peso muerto y elevación de talones diarios; talones 4 × 20; carga al 70% del máximo, +5% por semana | English et al., *npj Microgravity* 2020 — [PMC7434884](https://pmc.ncbi.nlm.nih.gov/articles/PMC7434884) | ✅ |
| Voto de varias corridas del modelo | Muestrear varias respuestas y quedarse con la mayoría mejora la exactitud (por ejemplo +17.9% en GSM8K) | Wang et al., *Self-Consistency Improves Chain of Thought Reasoning*, ICLR 2023 — [arXiv 2203.11171](https://arxiv.org/abs/2203.11171) | ⚠️ |
| QT en vuelos largos | Existe un estudio de la NASA sobre el QTc en vuelos cortos y largos; una revisión de 2024 dice que los vuelos largos se asocian con prolongación del QT | D'Aunno et al., *Am J Cardiol* 2003 (PubMed, sin resumen) — [DOI](https://doi.org/10.1016/s0002-9149(02)03259-9); Hussain et al., *Health Sci Rep* 2024 — [DOI](https://doi.org/10.1002/hsr2.2305) | ⚠️ (sin cifras vistas) |
| Índice de salud de la tripulación | El Integrated Medical Model de la NASA tiene una salida llamada *Crew Health Index* (capacidad funcional de la tripulación), junto con probabilidad de evacuación y de pérdida de vida. No se encontró su fórmula | [NASA IMM](https://www.nasa.gov/general/nasas-integrated-medical-model-imm/) | ⚠️ |

## 2. Qué hacer con cada pendiente de la lista

| Pendiente | Conclusión | Acción |
|---|---|---|
| Índice de salud y puntajes de tripulación (diseño) | La NASA tiene un *Crew Health Index*, pero es la salida de un modelo probabilístico, no un puntaje diario, y su fórmula no es pública | ❌ No inventar un puntaje. Seguir mostrando "parámetros nominales de los que tienen datos" |
| Riesgo de hueso y músculo en % | Ya documentado en `01` (hueso 1–2%/mes en columna y cadera, OCHMO-TB-030) | ✅ El panel ya lo muestra como estimación, con fuente |
| ECG en vivo (ritmo sinusal, QTc) | Hay literatura, pero la app no tiene un sensor de ECG | ❌ Dejarlo como "sin dato" |
| Fases del sueño | En `01`: solo 5 personas en Mir. Requiere polisomnografía o actigrafía | ❌ Dejarlo como "sin dato" |
| Límite diario de radiación 1.0 mSv | En `01`: la NASA solo tiene límites diarios "en consideración" (<1.3 mSv/día), no aprobados. Lo medido en la EEI es ~0.2–0.5 mSv/día | ❌ No mostrar un límite diario. Usar el límite de carrera (600 mSv) y el de tormenta (250 mSv), como ya hace la app |
| Horarios sugeridos de comida y ejercicio | Solo hay tiempo asignado (2.5 h/día de ejercicio, 6–7 días) en `01`. No se encontró un horario oficial | ❌ No mostrar horarios |
| Series y repeticiones del ARED | Fila de arriba (English 2020) | ✅ Se puede mostrar citando el protocolo |
| Factores de Atwater | Fila de arriba | ✅ Fuente agregada en el código |
| Valores de las raciones | Son ficticios y están etiquetados así | ❌ Siguen siendo de demostración |
| Retraso de 12 min | Fila de arriba: 12 min es el promedio aproximado | ✅ |

## 3. Decisiones del equipo que siguen sin fuente (y por qué)

| Decisión | Valor | Qué respalda el método | Qué no tiene respaldo |
|---|---|---|---|
| Alertar por desviación de la línea base personal | 2 desviaciones estándar | Mishra 2020 y Alavi 2021 usan desviaciones respecto a la línea base individual | El "2" y las 5 lecturas mínimas son elección nuestra |
| Margen mínimo | 5 lpm, 8 ms, 0.3 °C | Evita alertas por diferencias menores a la precisión del sensor | Los tres números. La guía IDSA usa +1.1 °C para fiebre: nuestro 0.3 °C es un **aviso temprano**, no un criterio de fiebre |
| Días fuera de rango excluidos de la línea base | — | Sin esto una fiebre larga "desaparece" (demostrado en el simulador) | Regla nuestra |
| Déficit de 3 días para rojo | 3 | — | Decisión nuestra |
| Propuesta A | 8/10 alta, 6/10 media | Wang 2022 respalda votar varias corridas | Los umbrales, y usar el acuerdo como confianza: no está calibrado |
| Consulta de seguimiento | máx. 1 | — | Regla de diseño |
| Línea base del panel | simulada por astronauta | — | No sale de un expediente médico |

## 4. Para la presentación

Decirlo así es más fuerte que esconderlo: los **requerimientos y límites** vienen de documentos de la NASA y de artículos revisados; el **método de alerta** (desviación de la línea base personal) tiene respaldo publicado; los **umbrales exactos** son decisiones del equipo, están etiquetados en la propia app y habría que validarlos con datos reales.
