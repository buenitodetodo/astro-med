import { describe, expect, it } from 'vitest';
import { ApiError, describeError } from '../src/lib/api';

const casos: [string, unknown, string][] = [
  ['browser cannot reach the service', new ApiError(0, 'offline'), 'NET-00'],
  ['server error', new ApiError(503, 'storage_unavailable'), 'SRV-503'],
  ['demo identity turned off', new ApiError(401, 'auth_not_configured'), 'AUTH-01'],
  ['too many requests', new ApiError(429, 'rate_limited'), 'RATE-429'],
  ['profile not allowed', new ApiError(403, 'forbidden'), 'AUTH-403'],
  ['request refused', new ApiError(409, 'emergency_cancelled'), 'REQ-409'],
  ['anything else', new TypeError('boom'), 'APP-00'],
];

describe('describeError', () => {
  it.each(casos)('%s ends with its code', (_nombre, error, codigo) => {
    expect(describeError(error)).toMatch(new RegExp(`\\(Code ${codigo}\\)$`));
  });

  it('adds which part failed to the code', () => {
    expect(describeError(new ApiError(503, 'x'), 'ST')).toMatch(/\(Code SRV-503-ST\)$/);
  });

  it('never shows technical words to the crew', () => {
    for (const [, error] of casos) {
      expect(describeError(error)).not.toMatch(/LM Studio|pnpm|server|\bAPI\b|tunnel|workflow|identity provider|demo mode/i);
    }
  });
});
