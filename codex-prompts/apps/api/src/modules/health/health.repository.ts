import { BaseRepository } from '@/lib/base-repository.js';

export class HealthRepository extends BaseRepository {
  /** Round-trips a trivial query; throws when the database is unreachable. */
  async pingDatabase(): Promise<void> {
    await this.db.$queryRaw`SELECT 1`;
  }
}
