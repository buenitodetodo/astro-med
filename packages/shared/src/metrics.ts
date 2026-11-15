/** Coherent metric → unit pairs and plausible input bounds (validation only, not clinical ranges). */
export const METRICS = {
  heart_rate: { unit: 'bpm', min: 20, max: 250, label: 'Heart rate' },
  hrv_sdnn: { unit: 'ms', min: 1, max: 500, label: 'Heart rate variability' },
  bp_systolic: { unit: 'mmHg', min: 40, max: 300, label: 'Systolic pressure' },
  bp_diastolic: { unit: 'mmHg', min: 20, max: 200, label: 'Diastolic pressure' },
  body_temperature: { unit: '°C', min: 25, max: 45, label: 'Body temperature' },
  spo2: { unit: '%', min: 50, max: 100, label: 'SpO₂' },
  skin_temperature: { unit: '°C', min: 20, max: 45, label: 'Skin temperature' },
  sleep_hours: { unit: 'h', min: 0, max: 24, label: 'Sleep' },
  radiation_dose: { unit: 'mSv', min: 0, max: 10000, label: 'Radiation dose' },
} as const;
export type Metric = keyof typeof METRICS;
export const METRIC_KEYS = Object.keys(METRICS) as [Metric, ...Metric[]];

export const VITAL_METRICS = {
  pulso_lpm: 'heart_rate',
  hrv_ms: 'hrv_sdnn',
  presion_sistolica: 'bp_systolic',
  presion_diastolica: 'bp_diastolic',
  temperatura_c: 'body_temperature',
  spo2: 'spo2',
} as const satisfies Record<string, Metric>;
export type VitalField = keyof typeof VITAL_METRICS;

export const DISCLAIMER =
  'Experimental demonstrator. Not a medical device, not flight software, and not endorsed or certified by NASA.';
