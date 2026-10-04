import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../generated/prisma/client.js';

/**
 * A Prisma client connected as the schema owner. Tests use it for setup and resets only:
 * the app itself connects as the least-privilege role, exactly as in production.
 */
export function createOwnerClient(connectionString: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

/** Quotes an SQL identifier (role and database names come from connection URLs). */
export function quoteIdentifier(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}
