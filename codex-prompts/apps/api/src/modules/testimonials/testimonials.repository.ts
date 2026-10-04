import type {
  TestimonialQuery,
  CreateTestimonialInput,
  UpdateTestimonialInput,
} from '@codex/shared';

import type { Prisma } from '@/generated/prisma/client.js';
import { BaseRepository } from '@/lib/base-repository.js';
import { MEDIA_DTO_SELECT } from '@/modules/content/media-dto.js';
import { withoutUndefined } from '@/utils/objects.js';
import { orderByOf } from '@/utils/sort.js';

export const TESTIMONIAL_SELECT = {
  id: true,
  clientName: true,
  company: true,
  rating: true,
  role: true,
  quote: true,
  photoId: true,
  order: true,
  isVisible: true,
  createdAt: true,
  updatedAt: true,
  photo: { select: MEDIA_DTO_SELECT },
} as const satisfies Prisma.TestimonialSelect;

export type TestimonialRow = Prisma.TestimonialGetPayload<{ select: typeof TESTIMONIAL_SELECT }>;

interface Page {
  skip: number;
  take: number;
}

export class TestimonialRepository extends BaseRepository {
  async list(query: TestimonialQuery, page: Page) {
    const where: Prisma.TestimonialWhereInput = {
      ...(query.isVisible !== undefined && { isVisible: query.isVisible }),
    };
    const [rows, total] = await Promise.all([
      this.db.testimonial.findMany({
        where,
        select: TESTIMONIAL_SELECT,
        orderBy: orderByOf(query.sortBy, query.sortOrder),
        skip: page.skip,
        take: page.take,
      }),
      this.db.testimonial.count({ where }),
    ]);
    return { rows, total };
  }

  /** Visible items in their arranged order, for the public site. */
  async listVisible(page: Page) {
    const where: Prisma.TestimonialWhereInput = {
      isVisible: true,
    };
    const [rows, total] = await Promise.all([
      this.db.testimonial.findMany({
        where,
        select: TESTIMONIAL_SELECT,
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
        skip: page.skip,
        take: page.take,
      }),
      this.db.testimonial.count({ where }),
    ]);
    return { rows, total };
  }

  findById(id: string): Promise<TestimonialRow | null> {
    return this.db.testimonial.findUnique({ where: { id }, select: TESTIMONIAL_SELECT });
  }

  create(input: CreateTestimonialInput): Promise<TestimonialRow> {
    const { company, photoId, ...fields } = input;
    return this.db.testimonial.create({
      data: {
        ...fields,
        company: company ?? null,
        photoId: photoId ?? null,
      },
      select: TESTIMONIAL_SELECT,
    });
  }

  update(id: string, input: UpdateTestimonialInput): Promise<TestimonialRow> {
    return this.db.testimonial.update({
      where: { id },
      data: withoutUndefined(input),
      select: TESTIMONIAL_SELECT,
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.testimonial.delete({ where: { id }, select: { id: true } });
  }
}
