import { describe, expect, it } from 'vitest';
import { demos } from '../src/lib/demos';
import { revisar_realismo } from '../src/lib/realism';

const base = { pulso_lpm: 60, hrv_ms: 55, presion_sistolica: 112, presion_diastolica: 72, temperatura_c: 36.6, spo2: 98, sueno_horas: 7.25 };
const requerimientos = { kcal: 2960, liquidos_ml: 2500 };
const revisar = (cambios: { campo: string; delta: number; rampa: number }[], signos_evento: Record<string, number | null> = {}) =>
  revisar_realismo({ cambios, linea_base: base, requerimientos, signos_evento });

describe('revisar_realismo', () => {
  it('accepts the changes of a normal illness', () => {
    expect(
      revisar([
        { campo: 'temperatura_c', delta: 1.3, rampa: 4 },
        { campo: 'pulso_lpm', delta: 14, rampa: 4 },
        { campo: 'kcal_factor', delta: -0.25, rampa: 3 },
        { campo: 'liquidos_ml', delta: -1400, rampa: 3 },
      ]),
    ).toEqual([]);
  });

  it('flags a temperature no human body reaches', () => {
    const avisos = revisar([{ campo: 'temperatura_c', delta: 20, rampa: 2 }]);
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toContain('56.6 °C');
    expect(avisos[0]).toContain('35–41');
  });

  it('flags eating about 10,000 kcal a day', () => {
    const avisos = revisar([{ campo: 'kcal_factor', delta: 2.25, rampa: 1 }]);
    expect(avisos[0]).toMatch(/Food intake would reach 10,00\d kcal/);
  });

  it('adds up several changes to the same variable', () => {
    expect(revisar([{ campo: 'pulso_lpm', delta: 70, rampa: 1 }])).toEqual([]);
    expect(revisar([{ campo: 'pulso_lpm', delta: 70, rampa: 1 }, { campo: 'pulso_lpm', delta: 70, rampa: 1 }])).toHaveLength(1);
  });

  it('checks the vital signs at the event on top of the gradual changes', () => {
    expect(revisar([], { pulso_lpm: 22, presion_sistolica: 14 })).toEqual([]);
    const avisos = revisar([{ campo: 'spo2', delta: -10, rampa: 2 }], { spo2: -30 });
    expect(avisos.some((aviso) => aviso.includes('at the event') && aviso.includes('58 %'))).toBe(true);
  });
});

describe('ready-made demos', () => {
  it('leave the hidden change two days away or the sudden event on the next day', () => {
    for (const demo of demos) {
      const { dias_totales, dia_inicio_cambios, dia_evento } = demo.cuerpo;
      expect(dias_totales).toBeGreaterThanOrEqual(7);
      expect(demo.avanzar).toBeLessThanOrEqual(dias_totales);
      if (dia_inicio_cambios !== undefined) {
        expect(dia_inicio_cambios).toBeGreaterThanOrEqual(6);
        expect(dia_inicio_cambios - demo.avanzar).toBe(2);
      } else if (dia_evento !== undefined) {
        expect(dia_evento - demo.avanzar).toBe(1);
        expect(dia_evento).toBe(dias_totales);
      }
    }
  });
});
