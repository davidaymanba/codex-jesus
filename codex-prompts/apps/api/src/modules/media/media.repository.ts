import type { MediaQuery, MediaUsageDto, UpdateMediaInput } from '@codex/shared';

import type { Prisma } from '@/generated/prisma/client.js';
import { BaseRepository } from '@/lib/base-repository.js';
import { escapeLike } from '@/utils/like.js';
import { orderByOf } from '@/utils/sort.js';

export const MEDIA_SELECT = {
  id: true,
  url: true,
  publicId: true,
  alt: true,
  width: true,
  height: true,
  mimeType: true,
  sizeBytes: true,
  uploadedById: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.MediaSelect;

export type MediaRow = Prisma.MediaGetPayload<{ select: typeof MEDIA_SELECT }>;

export interface NewMedia {
  url: string;
  publicId: string;
  alt: { ar: string; en: string };
  width: number;
  height: number;
  mimeType: string;
  sizeBytes: number;
  uploadedById: string;
}

export class MediaRepository extends BaseRepository {
  async list(query: MediaQuery, page: { skip: number; take: number }) {
    const where: Prisma.MediaWhereInput = query.mimeType ? { mimeType: query.mimeType } : {};
    const [rows, total] = await Promise.all([
      this.db.media.findMany({
        where,
        select: MEDIA_SELECT,
        orderBy: orderByOf(query.sortBy, query.sortOrder),
        skip: page.skip,
        take: page.take,
      }),
      this.db.media.count({ where }),
    ]);
    return { rows, total };
  }

  findById(id: string): Promise<MediaRow | null> {
    return this.db.media.findUnique({ where: { id }, select: MEDIA_SELECT });
  }

  create(data: NewMedia): Promise<MediaRow> {
    return this.db.media.create({ data, select: MEDIA_SELECT });
  }

  update(id: string, input: UpdateMediaInput): Promise<MediaRow> {
    return this.db.media.update({
      where: { id },
      data: input.alt ? { alt: input.alt } : {},
      select: MEDIA_SELECT,
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.media.delete({ where: { id }, select: { id: true } });
  }

  /**
   * Every place a media item is used: foreign keys (cover, OG image, gallery, photos, logos)
   * and image URLs inside rich text, which no foreign key protects. One parameterized query.
   */
  findUsages(id: string, url: string): Promise<MediaUsageDto[]> {
    const inText = `%${escapeLike(url)}%`;
    return this.db.$queryRaw<MediaUsageDto[]>`
      SELECT 'SERVICE' AS entity, id::text, 'cover' AS field FROM services WHERE "coverId" = ${id}::uuid
      UNION ALL SELECT 'SERVICE', id::text, 'ogImage' FROM services WHERE "ogImageId" = ${id}::uuid
      UNION ALL SELECT 'SERVICE', id::text, 'content' FROM services WHERE content::text LIKE ${inText}
      UNION ALL SELECT 'PROJECT', id::text, 'cover' FROM projects WHERE "coverId" = ${id}::uuid
      UNION ALL SELECT 'PROJECT', id::text, 'ogImage' FROM projects WHERE "ogImageId" = ${id}::uuid
      UNION ALL SELECT 'PROJECT', "projectId"::text, 'gallery' FROM project_gallery_images WHERE "mediaId" = ${id}::uuid
      UNION ALL SELECT 'PROJECT', id::text, 'content' FROM projects
        WHERE challenge::text LIKE ${inText} OR solution::text LIKE ${inText}
      UNION ALL SELECT 'POST', id::text, 'cover' FROM posts WHERE "coverId" = ${id}::uuid
      UNION ALL SELECT 'POST', id::text, 'ogImage' FROM posts WHERE "ogImageId" = ${id}::uuid
      UNION ALL SELECT 'POST', id::text, 'content' FROM posts WHERE content::text LIKE ${inText}
      UNION ALL SELECT 'TESTIMONIAL', id::text, 'photo' FROM testimonials WHERE "photoId" = ${id}::uuid
      UNION ALL SELECT 'TEAM_MEMBER', id::text, 'photo' FROM team_members WHERE "photoId" = ${id}::uuid
      UNION ALL SELECT 'CLIENT', id::text, 'logo' FROM clients WHERE "logoId" = ${id}::uuid
      UNION ALL SELECT 'SITE_SETTINGS', id::text, 'logo' FROM site_settings WHERE "logoId" = ${id}::uuid
      UNION ALL SELECT 'SITE_SETTINGS', id::text, 'ogImage' FROM site_settings WHERE "ogImageId" = ${id}::uuid`;
  }
}
