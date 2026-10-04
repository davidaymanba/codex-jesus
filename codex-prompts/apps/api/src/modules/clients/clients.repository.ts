import type { ClientQuery, CreateClientInput, UpdateClientInput } from '@codex/shared';

import type { Prisma } from '@/generated/prisma/client.js';
import { BaseRepository } from '@/lib/base-repository.js';
import { MEDIA_DTO_SELECT } from '@/modules/content/media-dto.js';
import { withoutUndefined } from '@/utils/objects.js';
import { orderByOf } from '@/utils/sort.js';

export const CLIENT_SELECT = {
  id: true,
  name: true,
  website: true,
  logoId: true,
  order: true,
  isVisible: true,
  createdAt: true,
  updatedAt: true,
  logo: { select: MEDIA_DTO_SELECT },
} as const satisfies Prisma.ClientSelect;

export type ClientRow = Prisma.ClientGetPayload<{ select: typeof CLIENT_SELECT }>;

interface Page {
  skip: number;
  take: number;
}

export class ClientRepository extends BaseRepository {
  async list(query: ClientQuery, page: Page) {
    const where: Prisma.ClientWhereInput = {
      ...(query.isVisible !== undefined && { isVisible: query.isVisible }),
    };
    const [rows, total] = await Promise.all([
      this.db.client.findMany({
        where,
        select: CLIENT_SELECT,
        orderBy: orderByOf(query.sortBy, query.sortOrder),
        skip: page.skip,
        take: page.take,
      }),
      this.db.client.count({ where }),
    ]);
    return { rows, total };
  }

  /** Visible items in their arranged order, for the public site. */
  async listVisible(page: Page) {
    const where: Prisma.ClientWhereInput = {
      isVisible: true,
    };
    const [rows, total] = await Promise.all([
      this.db.client.findMany({
        where,
        select: CLIENT_SELECT,
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
        skip: page.skip,
        take: page.take,
      }),
      this.db.client.count({ where }),
    ]);
    return { rows, total };
  }

  findById(id: string): Promise<ClientRow | null> {
    return this.db.client.findUnique({ where: { id }, select: CLIENT_SELECT });
  }

  create(input: CreateClientInput): Promise<ClientRow> {
    const { website, logoId, ...fields } = input;
    return this.db.client.create({
      data: {
        ...fields,
        website: website ?? null,
        logoId: logoId ?? null,
      },
      select: CLIENT_SELECT,
    });
  }

  update(id: string, input: UpdateClientInput): Promise<ClientRow> {
    return this.db.client.update({
      where: { id },
      data: withoutUndefined(input),
      select: CLIENT_SELECT,
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.client.delete({ where: { id }, select: { id: true } });
  }
}
