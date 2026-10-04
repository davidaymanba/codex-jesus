import type { Prisma } from '@/generated/prisma/client.js';
import { MEDIA_DTO_SELECT } from '@/modules/content/media-dto.js';

const media = { select: MEDIA_DTO_SELECT } as const;
const taxonomy = { id: true, name: true, slugAr: true, slugEn: true } as const;
const byCreation = [{ createdAt: 'asc' }, { id: 'asc' }] as const;

export const POST_SUMMARY_SELECT = {
  id: true,
  slugAr: true,
  slugEn: true,
  title: true,
  excerpt: true,
  cover: media,
  readingTimeAr: true,
  readingTimeEn: true,
  isFeatured: true,
  publishedAt: true,
  // The name only: an author's email is never public.
  author: { select: { name: true } },
  categories: { select: { ...taxonomy, type: true }, orderBy: [...byCreation] },
  tags: { select: taxonomy, orderBy: [...byCreation] },
} as const satisfies Prisma.PostSelect;

export const POST_SELECT = {
  ...POST_SUMMARY_SELECT,
  content: true,
  seo: true,
  ogImage: media,
  status: true,
  authorId: true,
  coverId: true,
  ogImageId: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.PostSelect;

export type PostSummaryRow = Prisma.PostGetPayload<{ select: typeof POST_SUMMARY_SELECT }>;
export type PostRow = Prisma.PostGetPayload<{ select: typeof POST_SELECT }>;
