import type {
  QuoteRequestExportQuery,
  QuoteRequestQuery,
  UpdateQuoteRequestInput,
} from '@codex/shared';

import { EXPORT_BATCH_SIZE } from '@/config/constants.js';
import type { Prisma } from '@/generated/prisma/client.js';
import { BaseRepository } from '@/lib/base-repository.js';
import { escapeLike } from '@/utils/like.js';
import { withoutUndefined } from '@/utils/objects.js';
import { orderByOf } from '@/utils/sort.js';

/** Everything the admin sees; never the IP hash or user agent. */
export const QUOTE_SELECT = {
  id: true,
  services: true,
  projectDetails: true,
  budgetRange: true,
  timeline: true,
  name: true,
  email: true,
  phone: true,
  company: true,
  locale: true,
  status: true,
  internalNotes: true,
  assignedTo: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.QuoteRequestSelect;

export type QuoteRow = Prisma.QuoteRequestGetPayload<{ select: typeof QUOTE_SELECT }>;

function filtersWhere(filters: QuoteRequestExportQuery): Prisma.QuoteRequestWhereInput {
  const term = filters.q ? escapeLike(filters.q) : undefined;
  return {
    ...(filters.status && { status: filters.status }),
    ...(filters.service && { services: { has: filters.service } }),
    ...(filters.assignedToId && { assignedToId: filters.assignedToId }),
    ...((filters.from ?? filters.to) && {
      createdAt: {
        ...(filters.from && { gte: new Date(filters.from) }),
        ...(filters.to && { lte: new Date(filters.to) }),
      },
    }),
    ...(term && {
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { company: { contains: term, mode: 'insensitive' } },
      ],
    }),
  };
}

export class QuoteRepository extends BaseRepository {
  async list(query: QuoteRequestQuery, page: { skip: number; take: number }) {
    const where = filtersWhere(query);
    const [rows, total] = await Promise.all([
      this.db.quoteRequest.findMany({
        where,
        select: QUOTE_SELECT,
        orderBy: orderByOf(query.sortBy, query.sortOrder),
        skip: page.skip,
        take: page.take,
      }),
      this.db.quoteRequest.count({ where }),
    ]);
    return { rows, total };
  }

  /** Every match, newest first, in keyset-paginated batches (ids are time-ordered UUIDv7). */
  async *batches(filters: QuoteRequestExportQuery): AsyncGenerator<QuoteRow[]> {
    const where = filtersWhere(filters);
    let cursor: string | undefined;
    for (;;) {
      const rows = await this.db.quoteRequest.findMany({
        where,
        select: QUOTE_SELECT,
        orderBy: { id: 'desc' },
        take: EXPORT_BATCH_SIZE,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });
      if (rows.length > 0) yield rows;
      if (rows.length < EXPORT_BATCH_SIZE) return;
      cursor = rows.at(-1)?.id;
    }
  }

  findById(id: string): Promise<QuoteRow | null> {
    return this.db.quoteRequest.findUnique({ where: { id }, select: QUOTE_SELECT });
  }

  update(id: string, input: UpdateQuoteRequestInput): Promise<QuoteRow> {
    return this.db.quoteRequest.update({
      where: { id },
      data: withoutUndefined(input),
      select: QUOTE_SELECT,
    });
  }

  async isActiveUser(id: string): Promise<boolean> {
    return (await this.db.user.count({ where: { id, isActive: true } })) === 1;
  }
}
