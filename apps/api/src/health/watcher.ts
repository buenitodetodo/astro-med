import { calcular_balance, fuente_nutricion } from "./calculator";
import type { Cuerpo, DiaBitacora } from "./calculator";
import { desviacion_estandar, promedio, redondear } from "./numbers";
import { decision_equipo, fuentes, umbrales } from "./thresholds";

const ms_por_dia = 86_400_000;
const dias_por_semana = 7;

export type Parametro =
  | "ingesta"
  | "ritmo_cardiaco"
  | "radiacion"
  | "sueno"
  | "temperatura"
  | "presion"
  | "musculo_hueso"
  | "spo2";

export type Color = "verde" | "amarillo" | "rojo" | "informativo" | "sin_datos";

export type DiaVigilado = DiaBitacora & {
  sueno_horas: number | null;
  ejercicio: { equipo: string; minutos: number }[];
};

export type Lectura = {
  registrado_en: string;
  pulso_lpm: number | null;
  hrv_ms: number | null;
  presion_sistolica: number | null;
  presion_diastolica: number | null;
  temperatura_c: number | null;
  spo2: number | null;
};

export type Dosis = { observado_en: string; msv: number };

type Datos = Record<string, number | string | null>;

export type Alerta = {
  codigo: string;
  parametro: Parametro;
  gravedad: "amarillo" | "rojo";
  fecha: string;
  mensaje: string;
  recomendacion: string;
  fuente: string;
};

export type Evaluacion = {
  parametro: Parametro;
  color: Color;
  mensaje: string;
  datos: Datos;
  fuente: string;
  alertas: Alerta[];
};

type Tendencia =
  | { suficiente: false; dia: string; lecturas_base: number; reciente: number }
  | { suficiente: true; dia: string; lecturas_base: number; reciente: number; linea_base: number; margen: number };

const fuente_margen = `${umbrales.desviaciones_para_cambio.valor} standard deviation margin, never below ${umbrales.margen_minimo_pulso_lpm.valor} bpm, ${umbrales.margen_minimo_hrv_ms.valor} ms or ${umbrales.margen_minimo_temperatura_c.valor} °C; days already out of range are left out of the baseline so an ongoing change does not hide itself: ${decision_equipo}`;

const margen_minimo = {
  pulso_lpm: umbrales.margen_minimo_pulso_lpm.valor,
  hrv_ms: umbrales.margen_minimo_hrv_ms.valor,
  temperatura_c: umbrales.margen_minimo_temperatura_c.valor,
};

const direccion_de_alerta = { pulso_lpm: 'sube', hrv_ms: 'baja', temperatura_c: 'sube' } as const;
const avisar_medico = "Repeat the measurement at rest and, if it persists, notify the flight surgeon.";

const evaluar_con_alertas = (
  parametro: Parametro,
  mensaje_sin_alertas: string,
  datos: Datos,
  fuente: string,
  alertas: Alerta[],
): Evaluacion => ({
  parametro,
  color: alertas.some((alerta) => alerta.gravedad === "rojo") ? "rojo" : alertas.length > 0 ? "amarillo" : "verde",
  mensaje: alertas.length > 0 ? alertas.map((alerta) => alerta.mensaje).join(" ") : mensaje_sin_alertas,
  datos,
  fuente,
  alertas,
});

const sin_evaluar = (
  parametro: Parametro,
  color: "sin_datos" | "informativo",
  mensaje: string,
  fuente: string,
  datos: Datos = {},
): Evaluacion => ({ parametro, color, mensaje, datos, fuente, alertas: [] });

const filtrar_ultima_semana = <Dia extends { fecha: string }>(dias: Dia[], fecha_final: string) => {
  const inicio = new Date(Date.parse(`${fecha_final}T00:00:00Z`) - (dias_por_semana - 1) * ms_por_dia)
    .toISOString()
    .slice(0, 10);
  return dias.filter((dia) => dia.fecha >= inicio && dia.fecha <= fecha_final);
};

const medir_tendencia = (lecturas: Lectura[], campo: "pulso_lpm" | "hrv_ms" | "temperatura_c"): Tendencia | null => {
  const con_valor = lecturas.flatMap((lectura) => {
    const valor = lectura[campo];
    return valor === null ? [] : [{ dia: lectura.registrado_en.slice(0, 10), valor }];
  });
  const ultima = con_valor.at(-1);
  if (!ultima) return null;

  const valores_del_dia = (dia: string) => con_valor.filter((lectura) => lectura.dia === dia).map((lectura) => lectura.valor);
  const dias = [...new Set(con_valor.map((lectura) => lectura.dia))].toSorted();
  const dias_normales: string[] = [];
  let tendencia: Tendencia = { suficiente: false, dia: ultima.dia, lecturas_base: 0, reciente: ultima.valor };

  for (const dia of dias) {
    const base = dias_normales.flatMap(valores_del_dia);
    const reciente = promedio(valores_del_dia(dia));
    if (base.length < umbrales.lecturas_minimas_linea_base.valor) {
      tendencia = { suficiente: false, dia, lecturas_base: base.length, reciente };
      dias_normales.push(dia);
      continue;
    }
    const linea_base = promedio(base);
    const margen = Math.max(umbrales.desviaciones_para_cambio.valor * desviacion_estandar(base), margen_minimo[campo]);
    tendencia = { suficiente: true, dia, lecturas_base: base.length, reciente, linea_base, margen };
    const fuera = direccion_de_alerta[campo] === 'sube' ? reciente > linea_base + margen : reciente < linea_base - margen;
    if (!fuera) dias_normales.push(dia);
  }
  return tendencia;
};

const describir_tendencia = (nombre: string, tendencia: Tendencia | null, decimales: number): Datos => {
  if (!tendencia) return { [`${nombre}_reciente`]: null };
  if (!tendencia.suficiente) {
    return {
      [`${nombre}_reciente`]: redondear(tendencia.reciente, decimales),
      [`${nombre}_lecturas_base`]: tendencia.lecturas_base,
    };
  }
  return {
    [`${nombre}_reciente`]: redondear(tendencia.reciente, decimales),
    [`${nombre}_linea_base`]: redondear(tendencia.linea_base, decimales),
    [`${nombre}_diferencia`]: redondear(tendencia.reciente - tendencia.linea_base, decimales),
    [`${nombre}_margen`]: redondear(tendencia.margen, decimales),
    [`${nombre}_lecturas_base`]: tendencia.lecturas_base,
  };
};

const mensaje_faltan_lecturas = `Not enough readings from previous days to build your baseline (${umbrales.lecturas_minimas_linea_base.valor} needed).`;

const evaluar_ingesta = (cuerpo: Cuerpo, con_equipo_ejercicio: boolean, dias: DiaVigilado[], hoy: string): Evaluacion => {
  const balance = calcular_balance(cuerpo, con_equipo_ejercicio, dias.filter((dia) => dia.fecha < hoy));
  const progreso_hoy = { hoy_kcal: dias.find((dia) => dia.fecha === hoy)?.kcal ?? null };
  const ultimo = balance.dias.at(-1);
  if (!ultimo) return sin_evaluar("ingesta", "sin_datos", "No complete day logged yet.", fuente_nutricion, progreso_hoy);
  if (ultimo.kcal === null && ultimo.proteina_g === null && ultimo.liquidos_ml === null) {
    return sin_evaluar("ingesta", "sin_datos", `No meals logged on ${ultimo.fecha}.`, fuente_nutricion, progreso_hoy);
  }

  const dias_seguidos = balance.resumen.dias_seguidos_en_deficit;
  const deficit_de_la_racha = balance.dias.slice(-dias_seguidos).reduce((suma, dia) => suma + (dia.balance_kcal ?? 0), 0);
  const alertas: Alerta[] = [];

  if (ultimo.balance_kcal !== null && ultimo.balance_kcal < 0) {
    const es_racha = dias_seguidos >= umbrales.dias_deficit_para_rojo.valor;
    alertas.push({
      codigo: es_racha ? "deficit_calorias_seguido" : "deficit_calorias",
      parametro: "ingesta",
      gravedad: es_racha ? "rojo" : "amarillo",
      fecha: ultimo.fecha,
      mensaje: es_racha
        ? `${dias_seguidos} days in a row with a calorie deficit (${redondear(deficit_de_la_racha, 0)} kcal accumulated).`
        : `On ${ultimo.fecha} you ate ${redondear(-ultimo.balance_kcal, 0)} kcal less than you needed.`,
      recomendacion: "Increase your intake, especially protein.",
      fuente: es_racha
        ? `${fuente_nutricion}; ${umbrales.dias_deficit_para_rojo.valor} days for red: ${decision_equipo}`
        : fuente_nutricion,
    });
  }
  if (ultimo.falta_proteina_g !== null && ultimo.falta_proteina_g > 0) {
    alertas.push({
      codigo: "proteina_baja",
      parametro: "ingesta",
      gravedad: "amarillo",
      fecha: ultimo.fecha,
      mensaje: `On ${ultimo.fecha} you were ${redondear(ultimo.falta_proteina_g)} g of protein short of the 1.2 g/kg minimum.`,
      recomendacion: "Add protein to today's meals.",
      fuente: fuente_nutricion,
    });
  }
  if (ultimo.falta_liquidos_ml !== null && ultimo.falta_liquidos_ml > 0) {
    alertas.push({
      codigo: "liquidos_bajos",
      parametro: "ingesta",
      gravedad: "amarillo",
      fecha: ultimo.fecha,
      mensaje: `On ${ultimo.fecha} you were ${redondear(ultimo.falta_liquidos_ml, 0)} ml of fluids short of your requirement.`,
      recomendacion: "Drink more fluids during the day.",
      fuente: fuente_nutricion,
    });
  }

  return evaluar_con_alertas(
    "ingesta",
    "Energy, protein and fluid requirements met.",
    {
      ...progreso_hoy,
      fecha: ultimo.fecha,
      kcal: ultimo.kcal,
      requerimiento_kcal: redondear(ultimo.requerimiento_kcal, 0),
      balance_kcal: redondear(ultimo.balance_kcal, 0),
      dias_seguidos_en_deficit: dias_seguidos,
      balance_acumulado_kcal: redondear(balance.resumen.balance_acumulado_kcal, 0),
    },
    fuente_nutricion,
    alertas,
  );
};

const evaluar_sueno = (dias: DiaVigilado[]): Evaluacion => {
  const fuente = umbrales.sueno_horas_fatiga.fuente;
  const ultimo = dias.at(-1);
  if (!ultimo) return sin_evaluar("sueno", "sin_datos", "No log entries yet.", fuente);
  if (ultimo.sueno_horas === null) {
    return sin_evaluar("sueno", "sin_datos", `No sleep logged on ${ultimo.fecha}.`, fuente);
  }

  const deuda_semana = filtrar_ultima_semana(dias, ultimo.fecha).reduce(
    (suma, dia) =>
      dia.sueno_horas === null ? suma : suma + Math.max(0, umbrales.sueno_horas_programadas.valor - dia.sueno_horas),
    0,
  );
  const alertas: Alerta[] = [];

  if (ultimo.sueno_horas <= umbrales.sueno_horas_fatiga.valor) {
    const hay_caminata = ultimo.caminata_espacial_horas > 0;
    alertas.push({
      codigo: hay_caminata ? "sueno_corto_con_tarea_critica" : "sueno_corto",
      parametro: "sueno",
      gravedad: hay_caminata ? "rojo" : "amarillo",
      fecha: ultimo.fecha,
      mensaje: hay_caminata
        ? `You slept ${ultimo.sueno_horas} h and have a spacewalk today: with 6 h or less, psychomotor response is slower.`
        : `You slept ${ultimo.sueno_horas} h: with 6 h or less, psychomotor response is slower.`,
      recomendacion: hay_caminata
        ? "Tell the crew before the spacewalk."
        : "Avoid critical tasks today if you can and recover sleep tonight.",
      fuente,
    });
  }

  return evaluar_con_alertas(
    "sueno",
    `You slept ${ultimo.sueno_horas} h.`,
    {
      fecha: ultimo.fecha,
      horas: ultimo.sueno_horas,
      deuda_7_dias_horas: redondear(deuda_semana),
      horas_programadas: umbrales.sueno_horas_programadas.valor,
    },
    fuente,
    alertas,
  );
};

const evaluar_ritmo_cardiaco = (lecturas: Lectura[]): Evaluacion => {
  const fuente = `${fuentes.ritmo_cardiaco}; ${fuente_margen}`;
  const pulso = medir_tendencia(lecturas, "pulso_lpm");
  const hrv = medir_tendencia(lecturas, "hrv_ms");
  if (!pulso && !hrv) {
    return sin_evaluar("ritmo_cardiaco", "sin_datos", "No heart rate or variability readings yet.", fuente);
  }

  const datos = { ...describir_tendencia("pulso_lpm", pulso, 1), ...describir_tendencia("hrv_ms", hrv, 1) };
  if (!pulso?.suficiente && !hrv?.suficiente) {
    return sin_evaluar("ritmo_cardiaco", "sin_datos", mensaje_faltan_lecturas, fuente, datos);
  }

  const alertas: Alerta[] = [];
  if (pulso?.suficiente && pulso.reciente > pulso.linea_base + pulso.margen) {
    alertas.push({
      codigo: "pulso_sube",
      parametro: "ritmo_cardiaco",
      gravedad: "amarillo",
      fecha: pulso.dia,
      mensaje: `Your heart rate rose to ${redondear(pulso.reciente)} bpm (baseline ${redondear(pulso.linea_base)}). Resting heart rate normally does not change in flight.`,
      recomendacion: avisar_medico,
      fuente,
    });
  }
  if (hrv?.suficiente && hrv.reciente < hrv.linea_base - hrv.margen) {
    alertas.push({
      codigo: "hrv_baja",
      parametro: "ritmo_cardiaco",
      gravedad: "amarillo",
      fecha: hrv.dia,
      mensaje: `Your heart rate variability dropped to ${redondear(hrv.reciente)} ms (baseline ${redondear(hrv.linea_base)}).`,
      recomendacion: avisar_medico,
      fuente,
    });
  }

  return evaluar_con_alertas("ritmo_cardiaco", "Heart rate and variability within your baseline.", datos, fuente, alertas);
};

const evaluar_temperatura = (lecturas: Lectura[]): Evaluacion => {
  const fuente = `${fuentes.temperatura}; ${fuente_margen}`;
  const temperatura = medir_tendencia(lecturas, "temperatura_c");
  if (!temperatura) return sin_evaluar("temperatura", "sin_datos", "No temperature readings yet.", fuente);

  const datos = describir_tendencia("temperatura_c", temperatura, 2);
  if (!temperatura.suficiente) return sin_evaluar("temperatura", "sin_datos", mensaje_faltan_lecturas, fuente, datos);

  const alertas: Alerta[] = [];
  if (temperatura.reciente > temperatura.linea_base + temperatura.margen) {
    alertas.push({
      codigo: "temperatura_sube",
      parametro: "temperatura",
      gravedad: "amarillo",
      fecha: temperatura.dia,
      mensaje: `Your temperature rose to ${redondear(temperatura.reciente, 2)} °C (baseline ${redondear(temperatura.linea_base, 2)} °C). In flight it rises about 1 °C gradually over 2.5 months; a quick jump is not expected.`,
      recomendacion: avisar_medico,
      fuente,
    });
  }

  return evaluar_con_alertas("temperatura", "Temperature within your baseline.", datos, fuente, alertas);
};

const evaluar_presion = (lecturas: Lectura[]): Evaluacion => {
  const ultima = lecturas.findLast((lectura) => lectura.presion_sistolica !== null && lectura.presion_diastolica !== null);
  if (!ultima) return sin_evaluar("presion", "sin_datos", "No blood pressure readings yet.", fuentes.presion);
  return sin_evaluar(
    "presion",
    "informativo",
    "Slightly lower blood pressure is normal in flight (systolic −8, diastolic −9 mmHg). No alert rule with a verified source.",
    fuentes.presion,
    {
      fecha: ultima.registrado_en.slice(0, 10),
      registrado_en: ultima.registrado_en,
      presion_sistolica: ultima.presion_sistolica,
      presion_diastolica: ultima.presion_diastolica,
    },
  );
};

const evaluar_spo2 = (lecturas: Lectura[]): Evaluacion => {
  const fuente = umbrales.spo2_minimo.fuente;
  const ultima = lecturas.findLast((lectura) => lectura.spo2 !== null);
  if (!ultima || ultima.spo2 === null) return sin_evaluar("spo2", "sin_datos", "No SpO₂ readings yet.", fuente);

  const fecha = ultima.registrado_en.slice(0, 10);
  const alertas: Alerta[] = [];
  if (ultima.spo2 < umbrales.spo2_minimo.valor) {
    alertas.push({
      codigo: "spo2_baja",
      parametro: "spo2",
      gravedad: "amarillo",
      fecha,
      mensaje: `Your SpO₂ is ${ultima.spo2}%, below ${umbrales.spo2_minimo.valor}%.`,
      recomendacion: avisar_medico,
      fuente,
    });
  }
  return evaluar_con_alertas("spo2", `SpO₂ ${ultima.spo2}%.`, { fecha, spo2: ultima.spo2 }, fuente, alertas);
};

const evaluar_musculo_hueso = (dias: DiaVigilado[]): Evaluacion => {
  const fuente = `${umbrales.ejercicio_minutos_semana_minimo.fuente}; ${umbrales.ejercicio_dias_semana_minimo.fuente}`;
  const ultimo = dias.at(-1);
  if (!ultimo) return sin_evaluar("musculo_hueso", "sin_datos", "No log entries yet.", fuente);

  const semana = filtrar_ultima_semana(dias, ultimo.fecha);
  const minutos_por_dia = semana.map((dia) => dia.ejercicio.reduce((suma, sesion) => suma + sesion.minutos, 0));
  const minutos_semana = minutos_por_dia.reduce((suma, minutos) => suma + minutos, 0);
  const dias_con_ejercicio = minutos_por_dia.filter((minutos) => minutos > 0).length;
  const datos = {
    fecha: ultimo.fecha,
    dias_registrados: semana.length,
    minutos_7_dias: minutos_semana,
    dias_con_ejercicio,
    minutos_minimos: umbrales.ejercicio_minutos_semana_minimo.valor,
    dias_minimos: umbrales.ejercicio_dias_semana_minimo.valor,
  };

  if (semana.length < dias_por_semana) {
    return sin_evaluar(
      "musculo_hueso",
      "sin_datos",
      `7 consecutive days of log entries are needed to estimate the risk (you have ${semana.length}).`,
      fuente,
      datos,
    );
  }

  const recomendacion = "Prioritize legs, hips and spine on the ARED, and complete your T2 or CEVIS sessions.";
  const alertas: Alerta[] = [];
  if (minutos_semana < umbrales.ejercicio_minutos_semana_minimo.valor) {
    alertas.push({
      codigo: "ejercicio_minutos_bajos",
      parametro: "musculo_hueso",
      gravedad: "amarillo",
      fecha: ultimo.fecha,
      mensaje: `${minutos_semana} min of exercise in 7 days; the ISS range is 450 to 720. Risk estimate, not a measurement: less exercise raises the risk of muscle and bone loss.`,
      recomendacion,
      fuente: umbrales.ejercicio_minutos_semana_minimo.fuente,
    });
  }
  if (dias_con_ejercicio < umbrales.ejercicio_dias_semana_minimo.valor) {
    alertas.push({
      codigo: "ejercicio_dias_bajos",
      parametro: "musculo_hueso",
      gravedad: "amarillo",
      fecha: ultimo.fecha,
      mensaje: `You exercised ${dias_con_ejercicio} of 7 days; the prescription is 6 to 7.`,
      recomendacion,
      fuente: umbrales.ejercicio_dias_semana_minimo.fuente,
    });
  }

  return evaluar_con_alertas(
    "musculo_hueso",
    "This week's exercise is within the prescription. Risk estimate, not a measurement.",
    datos,
    fuente,
    alertas,
  );
};

const evaluar_radiacion = (dosis: Dosis[]): Evaluacion => {
  const fuente = umbrales.radiacion_limite_carrera_msv.fuente;
  const limites = {
    limite_carrera_msv: umbrales.radiacion_limite_carrera_msv.valor,
    limite_tormenta_solar_msv: umbrales.radiacion_limite_tormenta_msv.valor,
  };
  const ultima = dosis.at(-1);
  if (!ultima) return sin_evaluar("radiacion", "sin_datos", "No radiation dose recorded yet.", fuente, limites);

  const dia = ultima.observado_en.slice(0, 10);
  const acumulada = dosis.reduce((suma, registro) => suma + registro.msv, 0);
  const del_dia = dosis.filter((registro) => registro.observado_en.slice(0, 10) === dia).reduce((suma, registro) => suma + registro.msv, 0);
  const mayor_registro = Math.max(...dosis.map((registro) => registro.msv));
  const datos = {
    ...limites,
    fecha: dia,
    dosis_dia_msv: redondear(del_dia, 2),
    dosis_acumulada_msv: redondear(acumulada, 2),
    porcentaje_limite_carrera: redondear((acumulada / umbrales.radiacion_limite_carrera_msv.valor) * 100, 1),
  };

  const alertas: Alerta[] = [];
  if (acumulada >= umbrales.radiacion_limite_carrera_msv.valor) {
    alertas.push({
      codigo: "radiacion_limite_carrera",
      parametro: "radiacion",
      gravedad: "rojo",
      fecha: dia,
      mensaje: `Accumulated dose of ${redondear(acumulada, 1)} mSv reached the ${umbrales.radiacion_limite_carrera_msv.valor} mSv career limit.`,
      recomendacion: "Notify the flight surgeon and mission control.",
      fuente,
    });
  }
  if (mayor_registro >= umbrales.radiacion_limite_tormenta_msv.valor) {
    alertas.push({
      codigo: "radiacion_tormenta_solar",
      parametro: "radiacion",
      gravedad: "rojo",
      fecha: dia,
      mensaje: `A single recorded dose of ${redondear(mayor_registro, 1)} mSv reached the ${umbrales.radiacion_limite_tormenta_msv.valor} mSv per-event solar storm limit.`,
      recomendacion: "Go to the storm shelter and notify mission control.",
      fuente: umbrales.radiacion_limite_tormenta_msv.fuente,
    });
  }

  return evaluar_con_alertas(
    "radiacion",
    `Accumulated dose ${redondear(acumulada, 1)} mSv, within the ${umbrales.radiacion_limite_carrera_msv.valor} mSv career limit.`,
    datos,
    fuente,
    alertas,
  );
};

export const vigilar = (
  cuerpo: Cuerpo,
  con_equipo_ejercicio: boolean,
  bitacora: DiaVigilado[],
  signos: Lectura[],
  dosis: Dosis[],
  hoy = new Date().toISOString().slice(0, 10),
) => {
  const dias = bitacora.toSorted((a, b) => a.fecha.localeCompare(b.fecha));
  const lecturas = signos.toSorted((a, b) => a.registrado_en.localeCompare(b.registrado_en));
  const registros_dosis = dosis.toSorted((a, b) => a.observado_en.localeCompare(b.observado_en));

  const evaluaciones = [
    evaluar_ingesta(cuerpo, con_equipo_ejercicio, dias, hoy),
    evaluar_ritmo_cardiaco(lecturas),
    evaluar_radiacion(registros_dosis),
    evaluar_sueno(dias),
    evaluar_temperatura(lecturas),
    evaluar_presion(lecturas),
    evaluar_musculo_hueso(dias),
    evaluar_spo2(lecturas),
  ];

  const alertas = evaluaciones
    .flatMap((evaluacion) => evaluacion.alertas)
    .toSorted((a, b) => Number(b.gravedad === "rojo") - Number(a.gravedad === "rojo"));

  const colores = evaluaciones.map((evaluacion) => evaluacion.color);
  const color_general: Color = colores.includes("rojo")
    ? "rojo"
    : colores.includes("amarillo")
      ? "amarillo"
      : colores.includes("verde")
        ? "verde"
        : "sin_datos";

  return {
    color_general,
    fecha_bitacora: dias.at(-1)?.fecha ?? null,
    fecha_signos: lecturas.at(-1)?.registrado_en.slice(0, 10) ?? null,
    evaluaciones,
    alertas,
  };
};
