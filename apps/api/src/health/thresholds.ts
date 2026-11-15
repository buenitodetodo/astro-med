export const decision_equipo = "team decision, no published source";

export const umbrales = {
  dias_deficit_para_rojo: { valor: 3, fuente: decision_equipo },
  desviaciones_para_cambio: { valor: 2, fuente: decision_equipo },
  lecturas_minimas_linea_base: { valor: 5, fuente: decision_equipo },
  margen_minimo_pulso_lpm: { valor: 5, fuente: decision_equipo },
  margen_minimo_hrv_ms: { valor: 8, fuente: decision_equipo },
  margen_minimo_temperatura_c: { valor: 0.3, fuente: decision_equipo },
  sueno_horas_fatiga: { valor: 6, fuente: "Jones et al., Sleep 2022" },
  sueno_horas_programadas: { valor: 8.5, fuente: "Jones et al., Sleep 2022" },
  spo2_minimo: { valor: 95, fuente: "General clinical range; no published spaceflight data" },
  ejercicio_minutos_semana_minimo: { valor: 450, fuente: "npj Microgravity 2023" },
  ejercicio_dias_semana_minimo: { valor: 6, fuente: "OCHMO-TB-031" },
  radiacion_limite_carrera_msv: { valor: 600, fuente: "NASA OCHMO Standards Overview" },
  radiacion_limite_tormenta_msv: { valor: 250, fuente: "NASA OCHMO Standards Overview" },
};

export const votacion = {
  rondas_por_modelo: { valor: 10, fuente: "Team plan: 10 rounds per model" },
  votos_alta: { valor: 8, fuente: "Proposal A: team decision, no published source" },
  votos_media: { valor: 6, fuente: "Proposal A: team decision, no published source" },
};

export const fuentes = {
  ritmo_cardiaco: "Xu et al. 2013; Norsk et al. 2015",
  temperatura: "Stahn et al., Sci Rep 2017",
  presion: "Norsk et al., J Physiol 2015",
};
