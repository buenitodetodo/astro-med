import type { z } from 'zod';
import type { Metric } from './metrics';
import type { sampleSchema, symptomSchema, syncEventSchema, vitalsSchema } from './schemas';

export type SampleSource = 'ble' | 'usb' | 'equipment' | 'manual' | 'simulated';
export type SampleQuality = 'ok' | 'low_confidence' | 'stale' | 'invalid';

export interface SensorSample {
  eventId: string;
  crewMemberId: string;
  deviceId?: string;
  metric: Metric;
  value: number;
  unit: string;
  observedAt: string;
  receivedAt: string;
  source: SampleSource;
  quality: SampleQuality;
}

export interface SensorAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(onSample: (sample: SensorSample) => void): () => void;
}

export type SamplePayload = z.infer<typeof sampleSchema>;
export type SymptomPayload = z.infer<typeof symptomSchema>;
export type VitalsPayload = z.infer<typeof vitalsSchema>;
export type SyncEvent = z.infer<typeof syncEventSchema>;

export interface SyncResult {
  accepted: string[];
  duplicate: string[];
  rejected: { eventId: string; reason: string }[];
}

/** Wire shapes returned by the API and also derived locally from the offline event log. */
export interface ObservationRow {
  eventId: string;
  metric: Metric;
  value: number;
  unit: string;
  source: SampleSource;
  quality: SampleQuality;
  observedAt: string;
}

export interface AlertRow {
  id: string;
  severity: 'info' | 'warning';
  triggerType: string;
  message: string;
  status: 'open' | 'acknowledged';
  createdAt: string;
}

export interface CrewProfile {
  id: string;
  callsign: string;
  role: string;
  mission: { id: string; name: string; phase: string; day: number; durationDays: number | null };
  isDemo: boolean;
}
