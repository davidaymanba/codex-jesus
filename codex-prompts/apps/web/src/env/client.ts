import { clientEnvSchema, parseEnv } from './schema';

// NEXT_PUBLIC_* values must be referenced statically so Next.js can inline them.
export const clientEnv = parseEnv(clientEnvSchema, {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
});
