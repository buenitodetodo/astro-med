// Sensor adapters, decoupled from the UI. Every sample carries its source so that
// simulated or self-reported values can never be shown as authentic measurements.
import { METRICS, type Metric, type SampleQuality, type SampleSource, type SensorAdapter, type SensorSample } from '@astro-med/shared';

/** Small seeded PRNG so simulated telemetry is reproducible. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export abstract class BaseAdapter implements SensorAdapter {
  private listeners = new Set<(s: SensorSample) => void>();
  constructor(protected crewMemberId: string, protected source: SampleSource, protected deviceId?: string) {}
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  subscribe(onSample: (s: SensorSample) => void) {
    this.listeners.add(onSample);
    return () => void this.listeners.delete(onSample);
  }
  protected emit(metric: Metric, value: number, quality: SampleQuality = 'ok') {
    const now = new Date().toISOString();
    const sample: SensorSample = {
      eventId: crypto.randomUUID(),
      crewMemberId: this.crewMemberId,
      deviceId: this.deviceId,
      metric, value, quality,
      unit: METRICS[metric].unit,
      observedAt: now,
      receivedAt: now,
      source: this.source,
    };
    this.listeners.forEach((l) => l(sample));
  }
}

/** Deterministic heart-rate + skin-temperature generator. Always labeled `simulated`. */
export class SimulatedSensorAdapter extends BaseAdapter {
  /** 0 (rest) … 1 (working). Set by the training console; the simulator never reads the camera. */
  activity = 0;
  private rnd: () => number;
  private hr = 66;
  private ticks = 0;
  private timer?: ReturnType<typeof setInterval>;
  constructor(crewMemberId: string, seed = 42, private intervalMs = 1000) {
    super(crewMemberId, 'simulated', 'sim-1');
    this.rnd = mulberry32(seed);
  }
  /** Advance one step. Public so tests can run it without timers. */
  tick() {
    const target = 66 + 62 * this.activity;
    this.hr += (target - this.hr) * 0.07 + (this.rnd() - 0.5) * 2.4;
    this.emit('heart_rate', Math.round(this.hr));
    if (this.ticks++ % 3 === 0) this.emit('skin_temperature', Math.round((33.1 + this.activity * 0.6 + this.rnd() * 0.3) * 10) / 10);
  }
  async connect() {
    this.timer ??= setInterval(() => this.tick(), this.intervalMs);
  }
  async disconnect() {
    clearInterval(this.timer);
    this.timer = undefined;
  }
}

/** Explicit self-reports (RPE, sleep, manually read SpO₂ …). Always labeled `manual`. */
export class ManualSensorAdapter extends BaseAdapter {
  constructor(crewMemberId: string) {
    super(crewMemberId, 'manual');
  }
  async connect() {}
  async disconnect() {}
  submit(metric: Metric, value: number) {
    const { min, max } = METRICS[metric];
    if (!Number.isFinite(value) || value < min || value > max) throw new RangeError(`${METRICS[metric].label} must be between ${min} and ${max}`);
    this.emit(metric, value);
  }
}

/** Parse a Bluetooth SIG Heart Rate Measurement (0x2A37) value. */
export function parseHeartRate(v: DataView): { bpm: number; quality: SampleQuality } {
  const flags = v.getUint8(0);
  const bpm = flags & 0x01 ? v.getUint16(1, true) : v.getUint8(1);
  // Bits 1–2: sensor-contact status. "Supported but no contact" is not a trustworthy reading.
  const contactSupported = (flags & 0x04) !== 0;
  const contact = (flags & 0x02) !== 0;
  return { bpm, quality: contactSupported && !contact ? 'low_confidence' : 'ok' };
}

/**
 * Web Bluetooth heart-rate strap (Heart Rate Service 0x180D). Chromium only, HTTPS/localhost,
 * must be started from a user gesture. Untested against physical hardware in this repository.
 */
export class BleHeartRateAdapter extends BaseAdapter {
  static supported = () => typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Web Bluetooth is not in lib.dom
  private device: any;
  onDisconnect?: () => void;
  constructor(crewMemberId: string) {
    super(crewMemberId, 'ble');
  }
  async connect() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bt = (navigator as any).bluetooth;
    this.device = await bt.requestDevice({ filters: [{ services: ['heart_rate'] }] });
    this.deviceId = String(this.device.name ?? 'ble-hr').slice(0, 64);
    this.device.addEventListener('gattserverdisconnected', () => this.onDisconnect?.());
    const server = await this.device.gatt.connect();
    const ch = await (await server.getPrimaryService('heart_rate')).getCharacteristic('heart_rate_measurement');
    ch.addEventListener('characteristicvaluechanged', (e: Event) => {
      const { bpm, quality } = parseHeartRate((e.target as unknown as { value: DataView }).value);
      this.emit('heart_rate', bpm, bpm < METRICS.heart_rate.min || bpm > METRICS.heart_rate.max ? 'invalid' : quality);
    });
    await ch.startNotifications();
  }
  async disconnect() {
    this.device?.gatt?.disconnect();
  }
}
