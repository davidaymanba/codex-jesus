import type { CreateServiceInput, ServiceQuery, UpdateServiceInput } from '@codex/shared';

import type { Prisma } from '@/generated/prisma/client.js';
import { BaseRepository } from '@/lib/base-repository.js';
import { toJsonInput, toNullableJsonInput } from '@/lib/prisma-json.js';
import { MEDIA_DTO_SELECT } from '@/modules/content/media-dto.js';
import {
  slugPrefixWhere,
  type SlugField,
  type SlugLookup,
  type RequestedSlugs,
  type Slugs,
} from '@/modules/content/slugs.js';
import { withoutUndefined } from '@/utils/objects.js';
import { orderByOf } from '@/utils/sort.js';

const media = { select: MEDIA_DTO_SELECT } as const;

export const SERVICE_SUMMARY_SELECT = {
  id: true,
  slugAr: true,
  slugEn: true,
  title: true,
  shortDescription: true,
  icon: true,
  category: true,
  order: true,
  cover: media,
} as const satisfies Prisma.ServiceSelect;

export const SERVICE_SELECT = {
  ...SERVICE_SUMMARY_SELECT,
  content: true,
  subServices: true,
  benefits: true,
  faqs: true,
  seo: true,
  status: true,
  coverId: true,
  ogImageId: true,
  ogImage: media,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.ServiceSelect;

export type ServiceSummaryRow = Prisma.ServiceGetPayload<{ select: typeof SERVICE_SUMMARY_SELECT }>;
export type ServiceRow = Prisma.ServiceGetPayload<{ select: typeof SERVICE_SELECT }>;

type ServiceCreate = CreateServiceInput & Slugs;
type ServiceUpdate = UpdateServiceInput & RequestedSlugs;

function toCreateData(input: ServiceCreate): Prisma.ServiceUncheckedCreateInput {
  return {
    slugAr: input.slugAr,
    slugEn: input.slugEn,
    title: input.title,
    shortDescription: input.shortDescription,
    content: toJsonInput(input.content),
    icon: input.icon,
    category: input.category,
    subServices: input.subServices,
    benefits: input.benefits,
    faqs: input.faqs,
    order: input.order,
    status: input.status,
    coverId: input.coverId ?? null,
    ogImageId: input.ogImageId ?? null,
    ...(input.seo !== undefined && { seo: toNullableJsonInput(input.seo) }),
  };
}

function toUpdateData(input: ServiceUpdate): Prisma.ServiceUncheckedUpdateInput {
  const { content, seo, ...fields } = withoutUndefined(input);
  return {
    ...fields,
    ...(content && { content: toJsonInput(content) }),
    ...(seo !== undefined && { seo: toNullableJsonInput(seo) }),
  };
}

export class ServiceRepository extends BaseRepository implements SlugLookup {
  async list(query: ServiceQuery, page: { skip: number; take: number }) {
    const where: Prisma.ServiceWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.category && { category: query.category }),
    };
    const [rows, total] = await Promise.all([
      this.db.service.findMany({
        where,
        select: SERVICE_SELECT,
        orderBy: orderByOf(query.sortBy, query.sortOrder),
        skip: page.skip,
        take: page.take,
      }),
      this.db.service.count({ where }),
    ]);
    return { rows, total };
  }

  async listPublished(page: { skip: number; take: number }) {
    const where = { status: 'PUBLISHED' } as const satisfies Prisma.ServiceWhereInput;
    const [rows, total] = await Promise.all([
      this.db.service.findMany({
        where,
        select: SERVICE_SUMMARY_SELECT,
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
        skip: page.skip,
        take: page.take,
      }),
      this.db.service.count({ where }),
    ]);
    return { rows, total };
  }

  findPublishedBySlug(field: SlugField, slug: string): Promise<ServiceRow | null> {
    const bySlug = field === 'slugAr' ? { slugAr: slug } : { slugEn: slug };
    return this.db.service.findFirst({
      where: { ...bySlug, status: 'PUBLISHED' },
      select: SERVICE_SELECT,
    });
  }

  findById(id: string): Promise<ServiceRow | null> {
    return this.db.service.findUnique({ where: { id }, select: SERVICE_SELECT });
  }

  create(input: ServiceCreate): Promise<ServiceRow> {
    return this.db.service.create({ data: toCreateData(input), select: SERVICE_SELECT });
  }

  update(id: string, input: ServiceUpdate): Promise<ServiceRow> {
    return this.db.service.update({
      where: { id },
      data: toUpdateData(input),
      select: SERVICE_SELECT,
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.service.delete({ where: { id }, select: { id: true } });
  }

  async takenSlugs(field: SlugField, base: string, excludeId?: string): Promise<string[]> {
    const rows = await this.db.service.findMany({
      where: slugPrefixWhere(field, base, excludeId),
      select: { slugAr: true, slugEn: true },
    });
    return rows.map((row) => row[field]);
  }
}
