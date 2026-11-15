import { describe, expect, it } from 'vitest';
import type { SensorSample } from '@astro-med/shared';
import { ManualSensorAdapter, parseHeartRate, SimulatedSensorAdapter } from '../src/lib/sensors/adapters';

const collect = (seed: number, activity: number) => {
  const sim = new SimulatedSensorAdapter('crew-test', seed);
  const out: SensorSample[] = [];
  sim.subscribe((s) => out.push(s));
  sim.activity = activity;
  for (let i = 0; i < 60; i++) sim.tick();
  return out;
};

describe('SimulatedSensorAdapter', () => {
  it('is deterministic for a seed and always labeled simulated', () => {
    const a = collect(42, 1).map((s) => s.value);
    expect(collect(42, 1).map((s) => s.value)).toEqual(a);
    expect(collect(43, 1).map((s) => s.value)).not.toEqual(a);
    expect(collect(42, 1).every((s) => s.source === 'simulated')).toBe(true);
  });
  it('responds to activity', () => {
    const hr = (xs: SensorSample[]) => xs.filter((s) => s.metric === 'heart_rate').at(-1)!.value;
    expect(hr(collect(1, 1))).toBeGreaterThan(hr(collect(1, 0)) + 20);
  });
});

describe('ManualSensorAdapter', () => {
  it('labels samples manual and rejects out-of-range input', () => {
    const m = new ManualSensorAdapter('crew-test');
    const out: SensorSample[] = [];
    m.subscribe((s) => out.push(s));
    m.submit('sleep_hours', 6);
    expect(out[0]).toMatchObject({ metric: 'sleep_hours', value: 6, unit: 'h', source: 'manual' });
    expect(() => m.submit('sleep_hours', 25)).toThrow(RangeError);
    expect(() => m.submit('spo2', NaN)).toThrow(RangeError);
  });
});

describe('parseHeartRate', () => {
  it('reads 8-bit and 16-bit values and the contact flag', () => {
    expect(parseHeartRate(new DataView(new Uint8Array([0x00, 72]).buffer))).toEqual({ bpm: 72, quality: 'ok' });
    expect(parseHeartRate(new DataView(new Uint8Array([0x01, 0x2c, 0x01]).buffer)).bpm).toBe(300);
    expect(parseHeartRate(new DataView(new Uint8Array([0x04, 80]).buffer)).quality).toBe('low_confidence');
    expect(parseHeartRate(new DataView(new Uint8Array([0x06, 80]).buffer)).quality).toBe('ok');
  });
});
