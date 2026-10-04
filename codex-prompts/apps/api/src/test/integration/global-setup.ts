import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { createIntegrationEnv, TEST_DATABASE_NAME } from '../test-env.js';
import { createOwnerClient, quoteIdentifier } from './owner-client.js';

function requireUrl(value: string | undefined, name: string): URL {
  if (!value) {
    throw new Error(
      `Integration tests need ${name}: set it in apps/api/.env (or TEST_${name}) and run docker compose up -d.`,
    );
  }
  return new URL(value);
}

/** Creates `codex_test` once, owned by the owner role, with the same grants as the dev database. */
async function ensureTestDatabase(ownerUrl: URL, appRole: string): Promise<void> {
  const maintenanceUrl = new URL(ownerUrl);
  maintenanceUrl.pathname = '/postgres';
  const admin = createOwnerClient(maintenanceUrl.toString());
  try {
    const existing = await admin.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = ${TEST_DATABASE_NAME}) AS exists`;
    if (!existing[0]?.exists)
      await admin.$executeRawUnsafe(`CREATE DATABASE ${quoteIdentifier(TEST_DATABASE_NAME)}`);
  } finally {
    await admin.$disconnect();
  }

  const owner = createOwnerClient(ownerUrl.toString());
  const ownerRole = quoteIdentifier(decodeURIComponent(ownerUrl.username));
  const app = quoteIdentifier(appRole);
  // Mirrors docker/postgres/init/01-app-role.sh; idempotent.
  try {
    for (const statement of [
      `GRANT CONNECT ON DATABASE ${quoteIdentifier(TEST_DATABASE_NAME)} TO ${app}`,
      'REVOKE CREATE ON SCHEMA public FROM PUBLIC',
      `GRANT USAGE ON SCHEMA public TO ${app}`,
      `ALTER DEFAULT PRIVILEGES FOR ROLE ${ownerRole} IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${app}`,
      `ALTER DEFAULT PRIVILEGES FOR ROLE ${ownerRole} IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${app}`,
    ]) {
      await owner.$executeRawUnsafe(statement);
    }
  } finally {
    await owner.$disconnect();
  }
}

/** Vitest global setup: an up-to-date, isolated test database before any suite runs. */
export default async function setup(): Promise<void> {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const env = createIntegrationEnv(process.env);
  const ownerUrl = requireUrl(env.TEST_DIRECT_URL, 'DIRECT_URL');
  const appUrl = requireUrl(env.DATABASE_URL, 'DATABASE_URL');

  await ensureTestDatabase(ownerUrl, decodeURIComponent(appUrl.username));
  execFileSync(join('node_modules', '.bin', 'prisma'), ['migrate', 'deploy'], {
    env: { ...process.env, DIRECT_URL: ownerUrl.toString() },
    stdio: 'pipe',
  });
}
