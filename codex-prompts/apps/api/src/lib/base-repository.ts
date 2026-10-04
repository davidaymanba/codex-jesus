import type { Prisma } from '@/generated/prisma/client.js';
import { prisma, type DbClient } from '@/lib/prisma.js';

/**
 * Base class for data-access repositories: queries only, no business rules.
 * Services pass a transaction client (see `withTransaction`) to make several
 * repository calls atomic; tests can pass a fake client.
 */
export abstract class BaseRepository {
  constructor(protected readonly db: DbClient = prisma) {}
}

/** Runs `work` in one interactive transaction; everything inside commits or rolls back together. */
export function withTransaction<TResult>(
  work: (tx: Prisma.TransactionClient) => Promise<TResult>,
): Promise<TResult> {
  return prisma.$transaction(work);
}
