import { Prisma } from '@/generated/prisma/client.js';
import { BaseRepository } from '@/lib/base-repository.js';

/** Tables with a hand-arranged `order` column. Only these names ever reach the SQL. */
export const ORDERED_TABLES = {
  services: 'services',
  projects: 'projects',
  testimonials: 'testimonials',
  teamMembers: 'team_members',
  clients: 'clients',
} as const;

export type OrderedTable = (typeof ORDERED_TABLES)[keyof typeof ORDERED_TABLES];

export class ReorderRepository extends BaseRepository {
  /**
   * Sets `order` to each id's position (0, 1, 2…) in one statement; returns how many rows
   * matched. The table name comes from `ORDERED_TABLES`; the ids are a bound parameter.
   */
  reorder(table: OrderedTable, ids: readonly string[]): Promise<number> {
    return this.db.$executeRaw`
      UPDATE ${Prisma.raw(`"${table}"`)} AS target
      SET "order" = arranged.position - 1, "updatedAt" = now()
      FROM unnest(${[...ids]}::uuid[]) WITH ORDINALITY AS arranged(id, position)
      WHERE target.id = arranged.id`;
  }
}
