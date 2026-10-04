import 'server-only';

import { cache } from 'react';
import { z } from 'zod';

import {
  CACHE_TAGS,
  PAGINATION,
  projectDtoSchema,
  projectSummaryDtoSchema,
  type Locale,
  type ProjectDto,
  type ServiceCategory,
} from '@codex/shared';

import { apiFetch } from './client';
import { findOrNull, slugSegment } from './lookup';

const PROJECT_TAGS = [CACHE_TAGS.PROJECTS, CACHE_TAGS.CATEGORIES, CACHE_TAGS.MEDIA] as const;

export interface ProjectFilters {
  /** Category slug in either locale. */
  category?: string | undefined;
  serviceCategory?: ServiceCategory | undefined;
  isFeatured?: boolean | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

/** A page of published projects, newest first (cards only). */
export const getProjects = cache(
  ({ category, serviceCategory, isFeatured, page, pageSize }: ProjectFilters = {}) =>
    apiFetch({
      path: '/public/projects',
      query: { category, serviceCategory, featured: isFeatured, page, pageSize },
      schema: z.array(projectSummaryDtoSchema),
      tags: PROJECT_TAGS,
    }),
);

/** Every published project in display order (previous / next links on a case study). */
export const getAllProjects = cache(
  async () => (await getProjects({ pageSize: PAGINATION.MAX_PAGE_SIZE })).data,
);

/** One published case study by its slug in `locale`; `null` if there is none. */
export const getProject = cache((slug: string, locale: Locale): Promise<ProjectDto | null> =>
  findOrNull(
    async () =>
      (
        await apiFetch({
          path: `/public/projects/${slugSegment(slug)}`,
          query: { locale },
          schema: projectDtoSchema,
          tags: PROJECT_TAGS,
        })
      ).data,
  ),
);
