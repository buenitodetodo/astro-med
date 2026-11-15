export type Demo = {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  cuerpo: { plantilla: string; dias_totales: number; dia_inicio_cambios?: number; dia_evento?: number };
  avanzar: number;
};

export const demos: Demo[] = [
  {
    id: 'infeccion',
    titulo: 'Infection in 2 days',
    descripcion: 'Healthy today. A respiratory infection starts in 2 days and the cough appears the day after.',
    icono: 'coronavirus',
    cuerpo: { plantilla: 'infeccion_respiratoria', dias_totales: 10, dia_inicio_cambios: 8 },
    avanzar: 6,
  },
  {
    id: 'fatiga',
    titulo: 'Sleep debt, then fainting',
    descripcion: 'Healthy today. Sleep starts to shrink in 2 days and the astronaut faints 4 days after that.',
    icono: 'bedtime',
    cuerpo: { plantilla: 'fatiga_y_desmayo', dias_totales: 12, dia_inicio_cambios: 8, dia_evento: 12 },
    avanzar: 6,
  },
  {
    id: 'deshidratacion',
    titulo: 'Dehydration in 2 days',
    descripcion: 'Healthy today. Fluid intake drops in 2 days; dark urine and flank discomfort come 3 days later.',
    icono: 'water_drop',
    cuerpo: { plantilla: 'deshidratacion_rinon', dias_totales: 11, dia_inicio_cambios: 8 },
    avanzar: 6,
  },
  {
    id: 'corte',
    titulo: 'Cut with a tool today',
    descripcion: 'Healthy until now. Press “Next day” once and the astronaut cuts a hand: straight to the emergency.',
    icono: 'healing',
    cuerpo: { plantilla: 'laceracion', dias_totales: 8, dia_evento: 8 },
    avanzar: 7,
  },
  {
    id: 'sano',
    titulo: 'Healthy astronaut',
    descripcion: 'A normal week with everything green. Use it to reset an astronaut.',
    icono: 'verified',
    cuerpo: { plantilla: 'control_sano', dias_totales: 7 },
    avanzar: 7,
  },
];
