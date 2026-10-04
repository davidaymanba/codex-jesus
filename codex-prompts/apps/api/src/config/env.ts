import { createPrivateKey } from 'node:crypto';

import { z } from 'zod';

const MIN_SECRET_BYTES = 32;
const MIN_DOCS_PASSWORD_LENGTH = 16;
const MAX_PROXY_HOPS = 5;
// A bare hostname such as "codex.com" (no scheme, port or path).
const HOSTNAME_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
// Development defaults for email addresses; production must configure real ones.
const DEVELOPMENT_EMAIL_DOMAIN = '@codex.local';
// Values copied from .env.example must never reach production.
const PLACEHOLDER_MARKER = 'change-me';

const secretSchema = z.string().refine((value) => Buffer.byteLength(value) >= MIN_SECRET_BYTES, {
  error: `must be at least ${MIN_SECRET_BYTES} bytes (openssl rand -base64 32)`,
});

/** Optional variable where an empty value (`KEY=` in .env) means "not set". */
function optional<TSchema extends z.ZodType>(schema: TSchema) {
  return z.preprocess((value) => (value === '' ? undefined : value), schema.optional());
}

// "Name <address>" or a bare address, as Resend accepts it.
const EMAIL_SENDER_PATTERN = /^(?:[^<>\r\n]{1,100} <[^\s<>@]+@[^\s<>@]+>|[^\s<>@]+@[^\s<>@]+)$/;
const emailAddressSchema = z.email();

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function isEd25519PrivateKey(base64Pem: string): boolean {
  try {
    const key = createPrivateKey(Buffer.from(base64Pem, 'base64').toString('utf8'));
    return key.asymmetricKeyType === 'ed25519';
  } catch {
    return false;
  }
}

/** Optional while developing, but production cannot run correctly without them. */
const PRODUCTION_REQUIRED = [
  'REDIS_URL',
  'REVALIDATE_SECRET',
  'INTERNAL_API_TOKEN',
  'TURNSTILE_SECRET_KEY',
  'RESEND_API_KEY',
  'CLOUDINARY_URL',
] as const;

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    FRONTEND_URL: z.url({ protocol: /^https?$/ }),
    /** Pooled, least-privilege runtime connection (migrations use DIRECT_URL via prisma.config.ts). */
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    /** Unset: no cache and in-memory rate limits. Required in production. */
    REDIS_URL: optional(z.url({ protocol: /^rediss?$/ })),
    /** Reverse proxies in front of the API (Railway: 1). Decides which client IP is trusted. */
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(MAX_PROXY_HOPS).default(0),
    /** Parent domain shared by web and API (e.g. `codex.com`); unset = host-only cookies. */
    COOKIE_DOMAIN: optional(z.string().regex(HOSTNAME_PATTERN)),
    /** Base64 of an Ed25519 PKCS#8 PEM private key; the public key is derived from it. */
    JWT_PRIVATE_KEY: z.string().refine(isEd25519PrivateKey, {
      error: 'must be a base64-encoded Ed25519 PKCS#8 PEM private key',
    }),
    JWT_ISSUER: z.string().min(1).default('codex-api'),
    JWT_AUDIENCE: z.string().min(1).default('codex-admin'),
    /** HMAC key binding CSRF tokens to a session. */
    CSRF_SECRET: secretSchema,
    /** HMAC key for ipHash columns (raw IPs are never stored). */
    IP_HASH_SECRET: secretSchema,
    /** Basic-auth credentials that enable /api/docs in production. */
    DOCS_USERNAME: optional(z.string().min(1)),
    DOCS_PASSWORD: optional(z.string().min(MIN_DOCS_PASSWORD_LENGTH)),

    /** Base URL of the admin UI, for links in emails. Defaults to FRONTEND_URL. */
    ADMIN_URL: optional(z.url({ protocol: /^https?$/ })),
    /** HMAC key signing the web revalidation webhook. Unset: no webhook (development). */
    REVALIDATE_SECRET: optional(secretSchema),
    /** Server-to-server token the web server sends for its own, higher rate limit. */
    INTERNAL_API_TOKEN: optional(secretSchema),
    /** Cloudflare Turnstile secret. Unset outside production: form bot checks are skipped. */
    TURNSTILE_SECRET_KEY: optional(z.string().min(1)),
    /** Resend API key. Unset: emails are logged (recipient masked), never sent. */
    RESEND_API_KEY: optional(z.string().startsWith('re_')),
    /** Sender of every email, e.g. `Codex <hello@codex.com>` (a domain verified in Resend). */
    EMAIL_FROM: z
      .string()
      .regex(EMAIL_SENDER_PATTERN)
      .default(`Codex <no-reply${DEVELOPMENT_EMAIL_DOMAIN}>`),
    /** Company inbox notified of new quote requests and contact messages. */
    EMAIL_NOTIFY_TO: emailAddressSchema.default(`leads${DEVELOPMENT_EMAIL_DOMAIN}`),
    /** `cloudinary://<api key>:<api secret>@<cloud name>`. Unset: uploads are refused. */
    CLOUDINARY_URL: optional(z.url({ protocol: /^cloudinary$/ })),
    /** Cloudinary folder per environment, so staging never mixes with production. */
    CLOUDINARY_FOLDER: optional(z.string().regex(/^[\w-]+(?:\/[\w-]+)*$/)),
    /** Time zone the dashboard groups leads by month in (IANA name). */
    REPORTING_TIME_ZONE: z.string().refine(isTimeZone).default('UTC'),
  })
  .superRefine((env, ctx) => {
    if ((env.DOCS_USERNAME === undefined) !== (env.DOCS_PASSWORD === undefined)) {
      ctx.addIssue({ code: 'custom', path: ['DOCS_PASSWORD'], message: 'set both or neither' });
    }
    if (env.NODE_ENV !== 'production') return;
    for (const key of PRODUCTION_REQUIRED) {
      if (!env[key])
        ctx.addIssue({ code: 'custom', path: [key], message: 'required in production' });
    }
    for (const key of ['EMAIL_FROM', 'EMAIL_NOTIFY_TO'] as const) {
      if (env[key].includes(DEVELOPMENT_EMAIL_DOMAIN)) {
        ctx.addIssue({ code: 'custom', path: [key], message: 'still the development default' });
      }
    }
    for (const key of [
      'CSRF_SECRET',
      'IP_HASH_SECRET',
      'DOCS_PASSWORD',
      'REVALIDATE_SECRET',
      'INTERNAL_API_TOKEN',
    ] as const) {
      if (env[key]?.includes(PLACEHOLDER_MARKER)) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: 'still the .env.example placeholder',
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export class EnvValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(`Invalid environment variables:\n${issues.map((issue) => `  - ${issue}`).join('\n')}`);
    this.name = 'EnvValidationError';
  }
}

/** Validates raw environment variables. Throws `EnvValidationError` listing every problem. */
export function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);
  if (result.success) return result.data;

  // Messages only: zod never echoes the (secret) input values here.
  const issues = result.error.issues.map(
    (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
  );
  throw new EnvValidationError(issues);
}

function loadEnv(): Env {
  try {
    return parseEnv(process.env);
  } catch (error) {
    // The logger depends on env, so report directly to stderr and fail fast.
    if (error instanceof EnvValidationError) {
      process.stderr.write(`\n${error.message}\n\nSee apps/api/.env.example.\n\n`);
      process.exit(1);
    }
    throw error;
  }
}

export const env = loadEnv();
