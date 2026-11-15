import { z } from 'zod';

const escala_1_a_5 = z.number().int().min(1).max(5);
const lista_textos = z.array(z.string().trim().min(1).max(200)).max(30);

export const perfil_schema = z.object({
  nombre: z.string().trim().min(1).max(100),
  edad: z.number().int().min(19).max(120),
  sexo: z.enum(['hombre', 'mujer']),
  peso_kg: z.number().positive().max(400),
  estatura_m: z.number().positive().max(3),
  porcentaje_grasa: z.number().min(0).max(100).optional(),
  masa_muscular_kg: z.number().positive().max(300).optional(),
  tipo_sangre: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  alergias: lista_textos.default([]),
  antecedentes: lista_textos.default([]),
});

export const bitacora_schema = z.object({
  fecha: z.iso.date(),
  sueno: z
    .object({
      horas: z.number().min(0).max(24).optional(),
      calidad: escala_1_a_5.optional(),
    })
    .optional(),
  ejercicio: z
    .array(
      z.object({
        equipo: z.enum(['ARED', 'T2', 'CEVIS', 'otro']),
        minutos: z.number().positive().max(600),
      }),
    )
    .max(20)
    .optional(),
  caminata_espacial_horas: z.number().min(0).max(24).optional(),
  animo: escala_1_a_5.optional(),
  sintomas: lista_textos.optional(),
});

export const rango_fechas_schema = z.object({
  desde: z.iso.date().optional(),
  hasta: z.iso.date().optional(),
});

const cantidad = z.number().min(0).max(10000).optional();

export const comida_schema = z
  .object({
    id: z.uuid(),
    comido_en: z.iso.datetime().optional(),
    codigo: z.string().trim().min(1).max(40).optional(),
    nombre: z.string().trim().min(1).max(100).optional(),
    kcal: cantidad,
    proteina_g: cantidad,
    carbohidratos_g: cantidad,
    grasas_g: cantidad,
    liquidos_ml: cantidad,
  })
  .refine((comida) => comida.codigo !== undefined || comida.nombre !== undefined, {
    message: 'send a ration code or a meal name',
    path: ['codigo'],
  });

export const signos_schema = z.object({
  eventId: z.uuid(),
  observedAt: z.iso.datetime().optional(),
  source: z.enum(['ble', 'usb', 'equipment', 'manual', 'simulated']),
  deviceId: z.string().max(64).optional(),
  pulso_lpm: z.number().optional(),
  hrv_ms: z.number().optional(),
  presion_sistolica: z.number().optional(),
  presion_diastolica: z.number().optional(),
  temperatura_c: z.number().optional(),
  spo2: z.number().optional(),
});

export const emergencia_schema = z.object({
  origen: z.enum(['sos', 'tripulacion', 'vigilante']).default('sos'),
  reportada_por: z.string().trim().min(1).max(100).optional(),
  descripcion: z.string().trim().min(1).max(2000).optional(),
});
