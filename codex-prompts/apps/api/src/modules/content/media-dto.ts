import { localizedTextDtoSchema, type MediaDto } from '@codex/shared';

import type { Prisma } from '@/generated/prisma/client.js';

import { parseJson } from './json.js';

/** Media fields every public DTO embeds (never the uploader or Cloudinary public id). */
export const MEDIA_DTO_SELECT = {
  id: true,
  url: true,
  alt: true,
  width: true,
  height: true,
} as const satisfies Prisma.MediaSelect;

export type MediaRow = Prisma.MediaGetPayload<{ select: typeof MEDIA_DTO_SELECT }>;

export function toMediaDto(media: MediaRow): MediaDto {
  return {
    id: media.id,
    url: media.url,
    alt: parseJson(localizedTextDtoSchema, media.alt),
    width: media.width,
    height: media.height,
  };
}

export const toOptionalMediaDto = (media: MediaRow | null): MediaDto | null =>
  media ? toMediaDto(media) : null;
