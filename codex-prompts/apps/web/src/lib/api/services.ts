import 'server-only';

import { cache } from 'react';
import { z } from 'zod';

import {
  CACHE_TAGS,
  PAGINATION,
  serviceDtoSchema,
  serviceSummaryDtoSchema,
  type Locale,
  type ServiceDto,
  type ServiceSummaryDto,
} from '@codex/shared';

import { apiFetch } from './client';
import { withFallback } from './fallback';
import { findOrNull, slugSegment } from './lookup';

const SERVICE_TAGS = [CACHE_TAGS.SERVICES, CACHE_TAGS.MEDIA] as const;

/** Published services in display order, for navigation and the footer (empty on failure). */
export const getNavigationServices = cache((): Promise<ServiceSummaryDto[]> =>
  withFallback(
    'navigation-services',
    async () =>
      (
        await apiFetch({
          path: '/public/services',
          query: { pageSize: PAGINATION.MAX_PAGE_SIZE },
          schema: z.array(serviceSummaryDtoSchema),
          tags: SERVICE_TAGS,
        })
      ).data,
    [],
  ),
);

/** One published service by its slug in `locale`; `null` if there is none. */
export const getService = cache((slug: string, locale: Locale): Promise<ServiceDto | null> =>
  findOrNull(
    async () =>
      (
        await apiFetch({
          path: `/public/services/${slugSegment(slug)}`,
          query: { locale },
          schema: serviceDtoSchema,
          tags: SERVICE_TAGS,
        })
      ).data,
  ),
);
