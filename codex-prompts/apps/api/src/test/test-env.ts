import { generateKeyPairSync, randomBytes } from 'node:crypto';

/** Base64 of a fresh Ed25519 PKCS#8 PEM private key, the format `JWT_PRIVATE_KEY` expects. */
export function generateJwtPrivateKey(): string {
  const { privateKey } = generateKeyPairSync('ed25519');
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  return Buffer.from(pem).toString('base64');
}

/** Fixed so tests can send it; never used outside tests. */
export const TEST_INTERNAL_API_TOKEN = 'test-internal-token-0123456789-abcdefghij';

/**
 * A valid environment for unit tests: random secrets, no Redis (in-memory fallbacks) and a
 * database URL that is never contacted. Integration tests override the URLs.
 */
export function createTestEnv(): Record<string, string> {
  return {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    FRONTEND_URL: 'http://localhost:3000',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/codex_test',
    JWT_PRIVATE_KEY: generateJwtPrivateKey(),
    CSRF_SECRET: randomBytes(32).toString('base64'),
    IP_HASH_SECRET: randomBytes(32).toString('base64'),
    INTERNAL_API_TOKEN: TEST_INTERNAL_API_TOKEN,
  };
}

/**
 * Values every production-only requirement accepts, for tests that load the app in
 * production mode. Nothing here is contacted: Redis points at a closed port.
 */
export function productionEnvOverrides(): Record<string, string> {
  return {
    NODE_ENV: 'production',
    REDIS_URL: 'redis://127.0.0.1:6399',
    REVALIDATE_SECRET: randomBytes(32).toString('base64'),
    INTERNAL_API_TOKEN: randomBytes(32).toString('base64'),
    TURNSTILE_SECRET_KEY: '2x0000000000000000000000000000000AA',
    RESEND_API_KEY: 're_test_never_used',
    EMAIL_FROM: 'Codex <hello@codex.example>',
    EMAIL_NOTIFY_TO: 'leads@codex.example',
    CLOUDINARY_URL: 'cloudinary://key:secret@codex-test',
  };
}

export const TEST_DATABASE_NAME = 'codex_test';
const TEST_REDIS_DATABASE = '1';

function withDatabase(url: string | undefined, database: string): string | undefined {
  if (!url) return undefined;
  const parsed = new URL(url);
  parsed.pathname = `/${database}`;
  return parsed.toString();
}

function withRedisDatabase(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const parsed = new URL(url);
  parsed.pathname = `/${TEST_REDIS_DATABASE}`;
  return parsed.toString();
}

/**
 * Environment for integration tests: the dev connection strings pointed at the separate
 * `codex_test` database (and Redis database 1), so tests never touch development data.
 * `TEST_*` variables override the derived values (CI sets them explicitly).
 * `TEST_DIRECT_URL` is the owner connection used for setup and resets only.
 */
export function createIntegrationEnv(source: NodeJS.ProcessEnv): Record<string, string> {
  const overrides = {
    DATABASE_URL: source.TEST_DATABASE_URL ?? withDatabase(source.DATABASE_URL, TEST_DATABASE_NAME),
    TEST_DIRECT_URL: source.TEST_DIRECT_URL ?? withDatabase(source.DIRECT_URL, TEST_DATABASE_NAME),
    REDIS_URL: source.TEST_REDIS_URL ?? withRedisDatabase(source.REDIS_URL),
  };
  const defined = Object.entries(overrides).filter(
    (entry): entry is [string, string] => entry[1] !== undefined,
  );
  return { ...createTestEnv(), ...Object.fromEntries(defined) };
}
