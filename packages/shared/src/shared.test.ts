import { describe, expect, it } from 'vitest';
import { sampleSchema, syncEventSchema } from './index';

const now = Date.now();
const iso = (daysAgo: number) => new Date(now - daysAgo * 86400_000).toISOString();
const sample = { metric: 'heart_rate', value: 120, unit: 'bpm', observedAt: iso(0), source: 'simulated', quality: 'ok' };

describe('sampleSchema', () => {
  it('requires a coherent metric/unit pair and a plausible value', () => {
    expect(sampleSchema.safeParse(sample).success).toBe(true);
    expect(sampleSchema.safeParse({ ...sample, unit: '%' }).success).toBe(false);
    expect(sampleSchema.safeParse({ ...sample, value: 900 }).success).toBe(false);
    expect(sampleSchema.safeParse({ ...sample, value: Infinity }).success).toBe(false);
    expect(sampleSchema.safeParse({ ...sample, source: 'webcam' }).success).toBe(false);
  });
  it('bounds timestamps', () => {
    expect(sampleSchema.safeParse({ ...sample, observedAt: iso(-2) }).success).toBe(false);
    expect(sampleSchema.safeParse({ ...sample, observedAt: iso(900) }).success).toBe(false);
    expect(sampleSchema.safeParse({ ...sample, observedAt: 'yesterday' }).success).toBe(false);
  });
});

describe('syncEventSchema', () => {
  it('rejects unknown event types and non-uuid ids', () => {
    expect(syncEventSchema.safeParse({ eventId: crypto.randomUUID(), type: 'observation', payload: sample }).success).toBe(true);
    expect(syncEventSchema.safeParse({ eventId: 'abc', type: 'observation', payload: sample }).success).toBe(false);
    expect(syncEventSchema.safeParse({ eventId: crypto.randomUUID(), type: 'video_frame', payload: {} }).success).toBe(false);
  });
});
