import { z } from 'zod';

const MIN_SECRET_BYTES = 32;
// Values copied from .env.example must never reach production.
const PLACEHOLDER_MARKER = 'change-me';
// `next build` runs in production mode but never serves requests or calls the API with them.
const BUILD_PHASE = 'phase-production-build';

const httpUrl = z.url({ protocol: /^https?$/ });

/** Shared with the API (same value on both sides); empty in .env means "not set". */
const sharedSecret = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z
    .string()
    .refine((value) => new TextEncoder().encode(value).length >= MIN_SECRET_BYTES, {
      error: `must be at least ${MIN_SECRET_BYTES} bytes (openssl rand -base64 32)`,
    })
    .refine((value) => !value.includes(PLACEHOLDER_MARKER), {
      error: 'still the .env.example placeholder',
    })
    .optional(),
);

/** Optional while developing, but a production server cannot work correctly without them. */
const PRODUCTION_REQUIRED = ['INTERNAL_API_TOKEN', 'REVALIDATE_SECRET'] as const;

export const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    NEXT_PHASE: z.string().optional(),
    API_URL: httpUrl,
    /** Sent as `x-codex-internal` so server-side API calls get the web server's rate limit. */
    INTERNAL_API_TOKEN: sharedSecret,
    /** Verifies the API's signed revalidation webhook. */
    REVALIDATE_SECRET: sharedSecret,
    /**
     * Serves /[locale]/dev/ui on a production build (local Lighthouse and e2e runs only);
     * the showcase is always available in development.
     */
    ENABLE_UI_SHOWCASE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production' || env.NEXT_PHASE === BUILD_PHASE) return;
    for (const key of PRODUCTION_REQUIRED) {
      if (!env[key])
        ctx.addIssue({ code: 'custom', path: [key], message: 'required in production' });
    }
  });

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: httpUrl,
  NEXT_PUBLIC_SITE_URL: httpUrl,
  /** Cloudflare Turnstile site key for the contact and quote forms. */
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/** Parses env with the given schema, throwing one readable error that lists every problem. */
export function parseEnv<TSchema extends z.ZodType>(
  schema: TSchema,
  source: Record<string, string | undefined>,
): z.infer<TSchema> {
  const result = schema.safeParse(source);
  if (result.success) return result.data;

  const issues = result.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment variables:\n${issues}\n\nSee apps/web/.env.example.`);
}
