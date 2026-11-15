type Rango = { nombre: string; unidad: string; minimo: number; maximo: number; decimales: number };

const rangos: Record<string, Rango> = {
  temperatura_c: { nombre: 'Temperature', unidad: '°C', minimo: 35, maximo: 41, decimales: 1 },
  pulso_lpm: { nombre: 'Resting heart rate', unidad: 'bpm', minimo: 35, maximo: 180, decimales: 0 },
  hrv_ms: { nombre: 'Heart rate variability', unidad: 'ms', minimo: 5, maximo: 150, decimales: 0 },
  presion_sistolica: { nombre: 'Systolic pressure', unidad: 'mmHg', minimo: 70, maximo: 200, decimales: 0 },
  presion_diastolica: { nombre: 'Diastolic pressure', unidad: 'mmHg', minimo: 40, maximo: 120, decimales: 0 },
  spo2: { nombre: 'SpO₂', unidad: '%', minimo: 80, maximo: 100, decimales: 0 },
  sueno_horas: { nombre: 'Sleep', unidad: 'h', minimo: 0, maximo: 12, decimales: 1 },
  sueno_calidad: { nombre: 'Sleep quality', unidad: 'of 5', minimo: 1, maximo: 5, decimales: 0 },
  animo: { nombre: 'Mood', unidad: 'of 5', minimo: 1, maximo: 5, decimales: 0 },
  kcal_factor: { nombre: 'Food intake', unidad: 'kcal', minimo: 0, maximo: 6000, decimales: 0 },
  liquidos_ml: { nombre: 'Fluids', unidad: 'ml', minimo: 500, maximo: 8000, decimales: 0 },
  ejercicio_factor: { nombre: 'Exercise', unidad: 'min a day', minimo: 0, maximo: 300, decimales: 0 },
  radiacion_msv: { nombre: 'Radiation dose', unidad: 'mSv a day', minimo: 0, maximo: 250, decimales: 1 },
};

const signos_del_evento = ['pulso_lpm', 'presion_sistolica', 'presion_diastolica', 'temperatura_c', 'spo2'];

type Datos = {
  cambios: { campo: string; delta: number; rampa: number }[];
  linea_base: Record<string, number | null | undefined>;
  requerimientos: { kcal: number; liquidos_ml: number };
  signos_evento: Record<string, number | null | undefined>;
};

const formato = (valor: number, decimales: number) =>
  valor.toLocaleString('en-US', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

export const revisar_realismo = ({ cambios, linea_base, requerimientos, signos_evento }: Datos): string[] => {
  const suma = (campo: string) => cambios.filter((cambio) => cambio.campo === campo && !Number.isNaN(cambio.delta)).reduce((total, cambio) => total + cambio.delta, 0);
  const valor_final = (campo: string): number | null => {
    const delta = suma(campo);
    if (campo === 'kcal_factor') return requerimientos.kcal * 1.04 * (1 + delta);
    if (campo === 'liquidos_ml') return requerimientos.liquidos_ml + 350 + delta;
    if (campo === 'ejercicio_factor') return 85 * (1 + delta);
    if (campo === 'radiacion_msv') return 0.4 + delta;
    if (campo === 'sueno_calidad' || campo === 'animo') return 4 + delta;
    const base = linea_base[campo];
    return base === null || base === undefined ? null : base + delta;
  };
  const fuera = (campo: string, valor: number | null, momento: string) => {
    const rango = rangos[campo];
    if (!rango || valor === null || (valor >= rango.minimo && valor <= rango.maximo)) return [];
    return [`${rango.nombre} would reach ${formato(valor, rango.decimales)} ${rango.unidad}${momento} (realistic range ${rango.minimo}–${rango.maximo}).`];
  };

  const campos_cambiados = [...new Set(cambios.map((cambio) => cambio.campo))];
  return [
    ...campos_cambiados.flatMap((campo) => fuera(campo, valor_final(campo), '')),
    ...signos_del_evento.flatMap((campo) => {
      const extra = signos_evento[campo];
      const base = valor_final(campo);
      return extra === null || extra === undefined || extra === 0 || base === null ? [] : fuera(campo, base + extra, ' at the event');
    }),
  ];
};
