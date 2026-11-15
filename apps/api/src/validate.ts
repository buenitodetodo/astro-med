import { zValidator } from '@hono/zod-validator';
import type { ZodType } from 'zod';

export const validate = <T extends ZodType, Target extends 'json' | 'query'>(target: Target, schema: T) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'invalid_request', issues: result.error.issues.slice(0, 10).map((i) => ({ path: i.path.join('.'), message: i.message })) }, 400);
  });

export const hoy_utc = () => new Date().toISOString().slice(0, 10);
