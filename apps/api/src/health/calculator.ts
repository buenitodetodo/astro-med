export const fuente_nutricion = "JSC-67378";
export const fuente_macros = "JSC-67378; Atwater general factors (4 kcal/g carbohydrate, 9 kcal/g fat): USDA Agriculture Handbook 74";

const factor_actividad_baja = 1.11;
const factor_actividad_con_equipo = 1.25;
const kcal_por_hora_caminata = 200;
const proteina_g_por_kg = { minimo: 1.2, maximo: 1.8 };
const carbohidratos_fraccion_energia = { minimo: 0.45, maximo: 0.65 };
const grasas_fraccion_energia = { minimo: 0.2, maximo: 0.35 };
const kcal_por_gramo = { carbohidratos: 4, grasas: 9 };
const liquidos_ml_por_kg = 32;
const liquidos_minimos_ml = { hombre: 2500, mujer: 2100 };
const ms_por_dia = 86_400_000;

export type Sexo = "hombre" | "mujer";

export type Cuerpo = {
  edad: number;
  sexo: Sexo;
  peso_kg: number;
  estatura_m: number;
};

export type DiaBitacora = {
  fecha: string;
  kcal: number | null;
  proteina_g: number | null;
  carbohidratos_g: number | null;
  grasas_g: number | null;
  liquidos_ml: number | null;
  caminata_espacial_horas: number;
};

export const elegir_factor_actividad = (con_equipo_ejercicio: boolean) =>
  con_equipo_ejercicio ? factor_actividad_con_equipo : factor_actividad_baja;

export const calcular_eer = (cuerpo: Cuerpo, con_equipo_ejercicio: boolean) => {
  const factor_actividad = elegir_factor_actividad(con_equipo_ejercicio);
  if (cuerpo.sexo === "hombre") {
    return 622 - 9.53 * cuerpo.edad + factor_actividad * (15.9 * cuerpo.peso_kg + 539.6 * cuerpo.estatura_m);
  }
  return 354 - 6.91 * cuerpo.edad + factor_actividad * (9.36 * cuerpo.peso_kg + 726 * cuerpo.estatura_m);
};

export const calcular_requerimientos = (cuerpo: Cuerpo, con_equipo_ejercicio: boolean) => {
  const energia_kcal = calcular_eer(cuerpo, con_equipo_ejercicio);
  return {
    factor_actividad: elegir_factor_actividad(con_equipo_ejercicio),
    energia_kcal,
    kcal_extra_por_hora_caminata: kcal_por_hora_caminata,
    proteina_g: {
      minimo: proteina_g_por_kg.minimo * cuerpo.peso_kg,
      maximo: proteina_g_por_kg.maximo * cuerpo.peso_kg,
    },
    carbohidratos_g: {
      minimo: (energia_kcal * carbohidratos_fraccion_energia.minimo) / kcal_por_gramo.carbohidratos,
      maximo: (energia_kcal * carbohidratos_fraccion_energia.maximo) / kcal_por_gramo.carbohidratos,
    },
    grasas_g: {
      minimo: (energia_kcal * grasas_fraccion_energia.minimo) / kcal_por_gramo.grasas,
      maximo: (energia_kcal * grasas_fraccion_energia.maximo) / kcal_por_gramo.grasas,
    },
    liquidos_ml: Math.max(liquidos_ml_por_kg * cuerpo.peso_kg, liquidos_minimos_ml[cuerpo.sexo]),
  };
};

const contar_dias_seguidos_en_deficit = (dias: { fecha: string; balance_kcal: number | null }[]) => {
  let dias_seguidos = 0;
  let fecha_siguiente: number | null = null;
  for (const dia of dias.toReversed()) {
    const fecha = Date.parse(`${dia.fecha}T00:00:00Z`);
    const es_dia_anterior = fecha_siguiente === null || fecha_siguiente - fecha === ms_por_dia;
    if (dia.balance_kcal === null || dia.balance_kcal >= 0 || !es_dia_anterior) break;
    dias_seguidos += 1;
    fecha_siguiente = fecha;
  }
  return dias_seguidos;
};

export const calcular_balance = (cuerpo: Cuerpo, con_equipo_ejercicio: boolean, bitacora: DiaBitacora[]) => {
  const requerimientos = calcular_requerimientos(cuerpo, con_equipo_ejercicio);
  const dias = bitacora
    .toSorted((a, b) => a.fecha.localeCompare(b.fecha))
    .map((dia) => {
      const requerimiento_kcal = requerimientos.energia_kcal + kcal_por_hora_caminata * dia.caminata_espacial_horas;
      return {
        fecha: dia.fecha,
        kcal: dia.kcal,
        requerimiento_kcal,
        balance_kcal: dia.kcal === null ? null : dia.kcal - requerimiento_kcal,
        proteina_g: dia.proteina_g,
        falta_proteina_g: dia.proteina_g === null ? null : Math.max(0, requerimientos.proteina_g.minimo - dia.proteina_g),
        carbohidratos_g: dia.carbohidratos_g,
        grasas_g: dia.grasas_g,
        liquidos_ml: dia.liquidos_ml,
        falta_liquidos_ml: dia.liquidos_ml === null ? null : Math.max(0, requerimientos.liquidos_ml - dia.liquidos_ml),
      };
    });

  const balances = dias.map((dia) => dia.balance_kcal).filter((balance) => balance !== null);

  return {
    dias,
    resumen: {
      dias_con_kcal: balances.length,
      dias_sin_kcal: dias.length - balances.length,
      balance_acumulado_kcal: balances.reduce((suma, balance) => suma + balance, 0),
      dias_seguidos_en_deficit: contar_dias_seguidos_en_deficit(dias),
    },
  };
};
