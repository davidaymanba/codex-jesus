import type { Role } from '@codex/shared';

import { hashPassword } from '@/utils/password.js';

import { createOwnerClient } from './owner-client.js';

const ownerUrl = process.env.TEST_DIRECT_URL;
if (!ownerUrl) throw new Error('TEST_DIRECT_URL is not set (see src/test/test-env.ts)');

/** Owner connection for resets and fixtures (the app role cannot TRUNCATE, by design). */
export const ownerDb = createOwnerClient(ownerUrl);

/** Empties every table except the migration history, so each test starts from zero. */
export async function resetDatabase(): Promise<void> {
  const tables = await ownerDb.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const list = tables.map(({ tablename }) => `"public"."${tablename}"`).join(', ');
  if (list) await ownerDb.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
}

export const TEST_PASSWORD = 'Tide-Lantern-47';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  role: Role;
}

/** Inserts an active user with a real argon2id hash. */
export async function createUser({
  role = 'ADMIN',
  email = `${role.toLowerCase()}@codex.example`,
  isActive = true,
}: {
  role?: Role;
  email?: string;
  isActive?: boolean;
} = {}): Promise<TestUser> {
  const { id } = await ownerDb.user.create({
    data: {
      name: 'Test User',
      email,
      role,
      isActive,
      passwordHash: await hashPassword(TEST_PASSWORD),
    },
    select: { id: true },
  });
  return { id, email, password: TEST_PASSWORD, role };
}
