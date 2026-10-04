import type { Prisma } from '@/generated/prisma/client.js';
import { MEDIA_DTO_SELECT } from '@/modules/content/media-dto.js';

const media = { select: MEDIA_DTO_SELECT } as const;

export const PROJECT_CATEGORIES_SELECT = {
  select: { id: true, name: true, slugAr: true, slugEn: true, type: true },
  orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
} as const satisfies Prisma.Project$categoriesArgs;

export const PROJECT_SUMMARY_SELECT = {
  id: true,
  slugAr: true,
  slugEn: true,
  title: true,
  client: true,
  industry: true,
  serviceCategory: true,
  cover: media,
  isFeatured: true,
  publishedAt: true,
  categories: PROJECT_CATEGORIES_SELECT,
} as const satisfies Prisma.ProjectSelect;

export const PROJECT_SELECT = {
  ...PROJECT_SUMMARY_SELECT,
  challenge: true,
  solution: true,
  results: true,
  techStack: true,
  gallery: { select: { media }, orderBy: { order: 'asc' } },
  seo: true,
  ogImage: media,
  status: true,
  order: true,
  coverId: true,
  ogImageId: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.ProjectSelect;

export type ProjectSummaryRow = Prisma.ProjectGetPayload<{ select: typeof PROJECT_SUMMARY_SELECT }>;
export type ProjectRow = Prisma.ProjectGetPayload<{ select: typeof PROJECT_SELECT }>;
