import { z } from 'zod';
import catalogo_json from '../../content/condition_catalog.json';
import raciones_json from '../../content/rations.json';
import tarjeta_json from '../../content/generic_card.json';

export const tarjeta_schema = z.object({
  titulo: z.string().min(1),
  estado: z.enum(['provisional', 'verificada']),
  fuente: z.string().min(1),
  pasos: z.array(z.string().min(1)).min(1),
  que_no_hacer: z.array(z.string().min(1)),
});

const raciones_schema = z.object({
  estado: z.enum(['ficticio', 'verificado']),
  fuente: z.string().min(1),
  raciones: z.array(
    z.object({
      codigo: z.string().min(1),
      nombre: z.string().min(1),
      kcal: z.number().min(0),
      proteina_g: z.number().min(0),
      carbohidratos_g: z.number().min(0),
      grasas_g: z.number().min(0),
      liquidos_ml: z.number().min(0),
    }),
  ),
});

export const fuera_del_catalogo = 'fuera_del_catalogo';

const catalogo_schema = z
  .object({
    estado: z.enum(['provisional', 'verificado']),
    fuente: z.string().min(1),
    condiciones: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9_]+$/),
          nombre: z.string().min(1),
          fuente: z.string().min(1),
          tarjeta: tarjeta_schema.nullable(),
        }),
      )
      .min(1),
  })
  .refine((catalogo) => new Set(catalogo.condiciones.map((condicion) => condicion.id)).size === catalogo.condiciones.length, {
    message: 'Repeated ids in the condition catalog',
  })
  .refine((catalogo) => catalogo.condiciones.every((condicion) => condicion.id !== fuera_del_catalogo), {
    message: `The id "${fuera_del_catalogo}" is reserved`,
  });

export const tarjeta_generica = tarjeta_schema.parse(tarjeta_json);
export const catalogo_raciones = raciones_schema.parse(raciones_json);
export const catalogo = catalogo_schema.parse(catalogo_json);

export const buscar_condicion = (id: string) => catalogo.condiciones.find((condicion) => condicion.id === id);

export const buscar_racion = (codigo: string) =>
  catalogo_raciones.raciones.find((racion) => racion.codigo.toUpperCase() === codigo.trim().toUpperCase());
