import type {
  ContactMessageExportQuery,
  ContactMessageQuery,
  UpdateContactMessageInput,
} from '@codex/shared';

import { EXPORT_BATCH_SIZE } from '@/config/constants.js';
import type { Prisma } from '@/generated/prisma/client.js';
import { BaseRepository } from '@/lib/base-repository.js';
import { escapeLike } from '@/utils/like.js';
import { withoutUndefined } from '@/utils/objects.js';
import { orderByOf } from '@/utils/sort.js';

/** Everything the admin sees; never the IP hash. */
export const CONTACT_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  message: true,
  locale: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.ContactMessageSelect;

export type ContactRow = Prisma.ContactMessageGetPayload<{ select: typeof CONTACT_SELECT }>;

function filtersWhere(filters: ContactMessageExportQuery): Prisma.ContactMessageWhereInput {
  const term = filters.q ? escapeLike(filters.q) : undefined;
  return {
    ...(filters.status && { status: filters.status }),
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
        { message: { contains: term, mode: 'insensitive' } },
      ],
    }),
  };
}

export class ContactRepository extends BaseRepository {
  async list(query: ContactMessageQuery, page: { skip: number; take: number }) {
    const where = filtersWhere(query);
    const [rows, total] = await Promise.all([
      this.db.contactMessage.findMany({
        where,
        select: CONTACT_SELECT,
        orderBy: orderByOf(query.sortBy, query.sortOrder),
        skip: page.skip,
        take: page.take,
      }),
      this.db.contactMessage.count({ where }),
    ]);
    return { rows, total };
  }

  /** Every match, newest first, in keyset-paginated batches (ids are time-ordered UUIDv7). */
  async *batches(filters: ContactMessageExportQuery): AsyncGenerator<ContactRow[]> {
    const where = filtersWhere(filters);
    let cursor: string | undefined;
    for (;;) {
      const rows = await this.db.contactMessage.findMany({
        where,
        select: CONTACT_SELECT,
        orderBy: { id: 'desc' },
        take: EXPORT_BATCH_SIZE,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });
      if (rows.length > 0) yield rows;
      if (rows.length < EXPORT_BATCH_SIZE) return;
      cursor = rows.at(-1)?.id;
    }
  }

  findById(id: string): Promise<ContactRow | null> {
    return this.db.contactMessage.findUnique({ where: { id }, select: CONTACT_SELECT });
  }

  update(id: string, input: UpdateContactMessageInput): Promise<ContactRow> {
    return this.db.contactMessage.update({
      where: { id },
      data: withoutUndefined(input),
      select: CONTACT_SELECT,
    });
  }
}
