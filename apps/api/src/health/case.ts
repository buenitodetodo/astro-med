import type { LecturaConFuente } from './data';
import type { Alerta } from './watcher';

export type DatosCaso = {
  edad: number;
  sexo: string;
  peso_kg: number;
  estatura_m: number;
  tipo_sangre: string | null;
  alergias: string[];
  antecedentes: string[];
  dia_mision: number | null;
  descripcion: string | null;
  sintomas: string[];
  sintomas_bitacora: string[];
  signos: LecturaConFuente[];
  alertas: Alerta[];
};

const unir = (valores: string[], vacio: string) => (valores.length > 0 ? valores.join(', ') : vacio);

const describir_signo = (signo: LecturaConFuente) => {
  const partes: string[] = [];
  if (signo.pulso_lpm !== null) partes.push(`heart rate ${signo.pulso_lpm} bpm`);
  if (signo.hrv_ms !== null) partes.push(`heart rate variability ${signo.hrv_ms} ms`);
  if (signo.presion_sistolica !== null) partes.push(`blood pressure ${signo.presion_sistolica}/${signo.presion_diastolica} mmHg`);
  if (signo.temperatura_c !== null) partes.push(`temperature ${signo.temperatura_c} °C`);
  if (signo.spo2 !== null) partes.push(`SpO₂ ${signo.spo2}%`);
  const fuente = signo.fuente === 'simulated' ? '' : `, ${signo.fuente}`;
  return `${signo.registrado_en.slice(0, 16).replace('T', ' ')} UTC${fuente}: ${partes.join(', ')}`;
};

export const armar_caso = (datos: DatosCaso) =>
  [
    `Astronaut: ${datos.edad} years old, ${datos.sexo === 'hombre' ? 'male' : 'female'}, ${datos.peso_kg} kg, ${datos.estatura_m} m. Blood type: ${datos.tipo_sangre ?? 'not recorded'}.`,
    `Mission day: ${datos.dia_mision ?? 'unknown'}.`,
    `Allergies: ${unir(datos.alergias, 'none recorded')}.`,
    `Medical history: ${unir(datos.antecedentes, 'none recorded')}.`,
    `What is happening: ${datos.descripcion ?? 'no description'}`,
    `Reported symptoms: ${unir(datos.sintomas, 'none')}.`,
    `Symptoms in the latest daily log: ${unir(datos.sintomas_bitacora, 'none')}.`,
    'Latest vital signs:',
    ...(datos.signos.length > 0 ? datos.signos.map((signo) => `- ${describir_signo(signo)}`) : ['- no readings']),
    'Watcher alerts:',
    ...(datos.alertas.length > 0 ? datos.alertas.map((alerta) => `- [${alerta.gravedad === 'rojo' ? 'red' : 'yellow'}] ${alerta.mensaje}`) : ['- none']),
  ].join('\n');
