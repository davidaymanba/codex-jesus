import { pino, type DestinationStream, type Logger } from 'pino';

import { LOG_REDACT_DEPTH, MASKED_LOG_KEYS, SENSITIVE_LOG_KEYS } from '@/config/constants.js';
import { env } from '@/config/env.js';

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/**
 * Expands every sensitive key to `key`, `*.key`, `*.*.key`… because a pino wildcard
 * matches exactly one level (`*.password` alone misses both `password` and `req.body.password`).
 */
export function buildRedactPaths(keys: readonly string[], depth: number): string[] {
  return keys.flatMap((key) =>
    Array.from({ length: depth }, (_, level) => {
      const wildcards = Array.from({ length: level }, () => '*').join('.');
      // Non-identifier keys (e.g. `set-cookie`) need bracket notation.
      if (!IDENTIFIER.test(key)) return `${wildcards}[${JSON.stringify(key)}]`;
      return wildcards ? `${wildcards}.${key}` : key;
    }),
  );
}

const REDACTED = '[REDACTED]';
const VISIBLE_PHONE_DIGITS = 2;
const MASKED_KEYS: ReadonlySet<string> = new Set(MASKED_LOG_KEYS);

/** Keeps the first character and domain of an email, and the last digits of a phone number. */
export function maskPii(value: unknown, key: string | undefined): string {
  if (typeof value !== 'string' || !key || !MASKED_KEYS.has(key)) return REDACTED;
  if (key === 'email') {
    const [local = '', domain] = value.split('@');
    return domain ? `${local.charAt(0)}***@${domain}` : REDACTED;
  }
  return `***${value.slice(-VISIBLE_PHONE_DIGITS)}`;
}

/** Creates the API logger. `destination` and `level` let tests capture output. */
export function createLogger(destination?: DestinationStream, level = env.LOG_LEVEL): Logger {
  const isPretty = env.NODE_ENV === 'development' && !destination;

  return pino(
    {
      level,
      base: { service: 'api', env: env.NODE_ENV },
      timestamp: pino.stdTimeFunctions.isoTime,
      redact: {
        paths: buildRedactPaths([...SENSITIVE_LOG_KEYS, ...MASKED_LOG_KEYS], LOG_REDACT_DEPTH),
        censor: (value, path) => maskPii(value, path.at(-1)),
      },
      ...(isPretty && {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss' },
        },
      }),
    },
    destination,
  );
}

export const logger = createLogger();
