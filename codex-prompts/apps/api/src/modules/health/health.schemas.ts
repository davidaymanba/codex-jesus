import { z } from 'zod';

export const livenessSchema = z.object({
  status: z.literal('ok'),
  uptime: z.number().meta({ description: 'Process uptime in seconds' }),
  timestamp: z.iso.datetime(),
});

const checkStatusSchema = z.enum(['ok', 'down', 'disabled']);

export const readinessSchema = z.object({
  status: z.enum(['ok', 'degraded', 'down']).meta({
    description: '`degraded`: the API works without cache and shared rate limits (Redis down)',
  }),
  checks: z.object({ database: checkStatusSchema, redis: checkStatusSchema }),
});

export type CheckStatus = z.infer<typeof checkStatusSchema>;
export type Readiness = z.infer<typeof readinessSchema>;
