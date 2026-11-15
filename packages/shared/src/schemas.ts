import { z } from 'zod';
import { METRICS, METRIC_KEYS, VITAL_METRICS, type VitalField } from './metrics';

const id = z.uuid();
const isoUtc = z.iso.datetime();

/** Reject timestamps far outside "now" so a broken clock cannot pollute history. */
const MAX_FUTURE_MS = 5 * 60_000;
const MAX_PAST_MS = 400 * 24 * 3600_000;
const boundedTime = isoUtc.refine((s) => {
  const d = Date.parse(s) - Date.now();
  return d < MAX_FUTURE_MS && d > -MAX_PAST_MS;
}, 'timestamp outside the accepted range');

export const sampleSchema = z
  .object({
    metric: z.enum(METRIC_KEYS),
    value: z.number().refine(Number.isFinite),
    unit: z.string().max(24),
    observedAt: boundedTime,
    source: z.enum(['ble', 'usb', 'equipment', 'manual', 'simulated']),
    quality: z.enum(['ok', 'low_confidence', 'stale', 'invalid']),
    deviceId: z.string().max(64).optional(),
  })
  .superRefine((s, ctx) => {
    const m = METRICS[s.metric];
    if (s.unit !== m.unit) ctx.addIssue({ code: 'custom', message: `unit for ${s.metric} must be ${m.unit}` });
    if (s.value < m.min || s.value > m.max)
      ctx.addIssue({ code: 'custom', message: `${s.metric} must be within ${m.min}–${m.max} ${m.unit}` });
  });

export const symptomSchema = z.object({
  note: z.string().trim().max(280),
  reportedAt: boundedTime,
});

const vitalValue = (metric: keyof typeof METRICS) => z.number().min(METRICS[metric].min).max(METRICS[metric].max).optional();

export const vitalsSchema = z
  .object({
    observedAt: boundedTime,
    source: z.enum(['ble', 'usb', 'equipment', 'manual', 'simulated']),
    deviceId: z.string().max(64).optional(),
    pulso_lpm: vitalValue(VITAL_METRICS.pulso_lpm),
    hrv_ms: vitalValue(VITAL_METRICS.hrv_ms),
    presion_sistolica: vitalValue(VITAL_METRICS.presion_sistolica),
    presion_diastolica: vitalValue(VITAL_METRICS.presion_diastolica),
    temperatura_c: vitalValue(VITAL_METRICS.temperatura_c),
    spo2: vitalValue(VITAL_METRICS.spo2),
  })
  .refine((v) => (Object.keys(VITAL_METRICS) as VitalField[]).some((field) => v[field] !== undefined), {
    message: 'send at least one vital sign',
  })
  .refine((v) => (v.presion_sistolica === undefined) === (v.presion_diastolica === undefined), {
    message: 'blood pressure needs systolic and diastolic together',
    path: ['presion_diastolica'],
  });

export const syncEventSchema = z.discriminatedUnion('type', [
  z.object({ eventId: id, type: z.literal('observation'), payload: sampleSchema }),
  z.object({ eventId: id, type: z.literal('symptom_report'), payload: symptomSchema }),
  z.object({ eventId: id, type: z.literal('vitals'), payload: vitalsSchema }),
]);

export const MAX_BATCH = 100;
/** Events are validated one by one so a single bad event is rejected without failing the batch. */
export const syncBatchSchema = z.object({
  events: z
    .array(z.object({ eventId: id }).loose())
    .min(1)
    .max(MAX_BATCH),
});

export const manualObservationSchema = z.object({
  eventId: id,
  metric: z.enum(METRIC_KEYS),
  value: z.number(),
  observedAt: boundedTime.optional(),
});

export const observationsQuerySchema = z.object({
  metric: z.enum(METRIC_KEYS).optional(),
  from: isoUtc.optional(),
  to: isoUtc.optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
  cursor: isoUtc.optional(),
});
