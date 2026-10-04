import { describe, expect, it } from 'vitest';

import { BaseRepository } from './base-repository.js';
import { prisma, type DbClient } from './prisma.js';

class ProbeRepository extends BaseRepository {
  get client(): DbClient {
    return this.db;
  }
}

describe('BaseRepository', () => {
  it('defaults to the shared Prisma client', () => {
    expect(new ProbeRepository().client).toBe(prisma);
  });

  it('uses an injected client (transactions, tests)', () => {
    const transactionClient = {} as DbClient;

    expect(new ProbeRepository(transactionClient).client).toBe(transactionClient);
  });
});
