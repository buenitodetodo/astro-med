import { useCallback, useEffect, useState } from 'react';
import { api, describeError } from './api';
import { sondear } from './polling';

export type Color = 'verde' | 'amarillo' | 'rojo' | 'informativo' | 'sin_datos';

export type Alerta = {
  codigo: string;
  parametro: string;
  gravedad: 'amarillo' | 'rojo';
  fecha: string;
  mensaje: string;
  recomendacion: string;
  fuente: string;
};

export type Evaluacion = {
  parametro: string;
  color: Color;
  mensaje: string;
  datos: Record<string, number | string | null>;
  fuente: string;
  alertas: number;
};

export type Estado = {
  color_general: Color;
  semaforo: Evaluacion[];
  recomendacion_del_dia: { mensaje: string; motivo: string | null; parametro: string | null; fuente: string | null };
  alertas: Alerta[];
  total_alertas: number;
};

export type Me = {
  id: string;
  callsign: string;
  role: string;
  mission: { id: string; name: string; phase: string; day: number; durationDays: number | null };
  demoCrew: { id: string; callsign: string; role: string; name: string | null }[];
};

export type Perfil = {
  nombre: string;
  callsign: string;
  rol: string;
  edad: number;
  sexo: 'hombre' | 'mujer';
  peso_kg: number;
  tipo_sangre: string | null;
  alergias: string[];
  antecedentes: string[];
};

type Rango = { minimo: number; maximo: number };

export type Nutricion = {
  fuente: string;
  fuente_macros: string;
  requerimientos: {
    energia_kcal: number;
    kcal_extra_por_hora_caminata: number;
    proteina_g: Rango;
    carbohidratos_g: Rango;
    grasas_g: Rango;
    liquidos_ml: number;
  };
};

export type Comida = { id: string; fecha: string; comido_en: string; codigo: string | null; nombre: string; kcal: number; liquidos_ml: number };

export type Comidas = {
  fecha: string;
  comidas: Comida[];
  totales: { kcal: number; proteina_g: number; carbohidratos_g: number; grasas_g: number; liquidos_ml: number };
};

export type Sesion = { equipo: 'ARED' | 'T2' | 'CEVIS' | 'otro'; minutos: number };

export type Dia = {
  fecha: string;
  kcal: number | null;
  sueno_horas: number | null;
  sueno_calidad: number | null;
  ejercicio: Sesion[];
  caminata_espacial_horas: number;
};

export type Lectura = {
  registrado_en: string;
  fuente: string;
  pulso_lpm: number | null;
  hrv_ms: number | null;
  presion_sistolica: number | null;
  presion_diastolica: number | null;
  temperatura_c: number | null;
  spo2: number | null;
};

export type Dosis = { value: number; observedAt: string; source: string };

export type DatosTripulante = {
  me: Me;
  perfil: Perfil;
  estado: Estado;
  nutricion: Nutricion;
  comidas: Comidas;
  dias: Dia[];
  lecturas: Lectura[];
  dosis: Dosis[];
  faltantes: string[];
  actualizado: string;
};

export const hoy_utc = () => new Date().toISOString().slice(0, 10);

export const nuevo_id = () => crypto.randomUUID();

const partes: Record<string, string> = {
  '/v1/me': 'ME',
  '/v1/profile': 'PF',
  '/v1/status': 'ST',
  '/v1/nutrition': 'NU',
  '/v1/meals': 'ML',
  '/v1/log': 'LG',
  '/v1/vitals': 'VT',
  '/v1/observations': 'RD',
};

export function useTripulante(crew_id: string) {
  const [datos, setDatos] = useState<DatosTripulante | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const opciones = { crewId: crew_id };
    const faltantes: string[] = [];
    const parte = (ruta: string) => partes[ruta.split('?')[0]!] ?? 'XX';
    const pedir = <T,>(ruta: string) =>
      api<T>(ruta, opciones).catch((e: unknown) => {
        throw { causa: e, parte: parte(ruta) };
      });
    const opcional = <T,>(ruta: string) =>
      api<T>(ruta, opciones).catch(() => {
        faltantes.push(parte(ruta));
        return null;
      });
    try {
      const [me, perfil, estado, nutricion, comidas, bitacora, signos, radiacion] = await Promise.all([
        pedir<Me>('/v1/me'),
        pedir<Perfil>('/v1/profile'),
        pedir<Estado>('/v1/status'),
        pedir<Nutricion>('/v1/nutrition'),
        pedir<Comidas>('/v1/meals'),
        opcional<{ dias: Dia[] }>('/v1/log'),
        opcional<{ lecturas: Lectura[] }>('/v1/vitals?dias=30'),
        opcional<{ observations: Dosis[] }>('/v1/observations?metric=radiation_dose&limit=60'),
      ]);
      setDatos({
        me, perfil, estado, nutricion, comidas,
        dias: bitacora?.dias ?? [],
        lecturas: signos?.lecturas ?? [],
        dosis: radiacion?.observations ?? [],
        faltantes,
        actualizado: new Date().toISOString(),
      });
      setError(null);
    } catch (e) {
      const fallo = e as { causa?: unknown; parte?: string };
      setError(fallo.parte ? describeError(fallo.causa, fallo.parte) : describeError(e));
    }
  }, [crew_id]);

  useEffect(() => {
    setDatos(null);
    void cargar();
    return sondear(() => void cargar(), () => 60_000);
  }, [cargar]);

  return { datos, error, recargar: cargar };
}

export function useEstadosTripulacion(ids: string[]) {
  const [estados, setEstados] = useState<Record<string, Estado | null>>({});
  const clave = ids.join(',');

  useEffect(() => {
    let vigente = true;
    const cargar = async () => {
      const pares = await Promise.all(
        ids.map(async (id) => [id, await api<Estado>('/v1/status', { crewId: id }).catch(() => null)] as const),
      );
      if (vigente) setEstados(Object.fromEntries(pares));
    };
    void cargar();
    const parar = sondear(() => void cargar(), () => 120_000);
    return () => {
      vigente = false;
      parar();
    };
  }, [clave]);

  return estados;
}

export const registrar_racion = (crew_id: string, codigo: string) =>
  api<Comida>('/v1/meals', { crewId: crew_id, method: 'POST', body: JSON.stringify({ id: nuevo_id(), codigo }) });

export const registrar_sesion = (crew_id: string, dia_actual: Dia | undefined, sesion: Sesion) =>
  api<Dia>('/v1/log', {
    crewId: crew_id,
    method: 'POST',
    body: JSON.stringify({ fecha: hoy_utc(), ejercicio: [...(dia_actual?.ejercicio ?? []), sesion] }),
  });

export { describeError };
