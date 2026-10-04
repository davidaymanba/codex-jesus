import 'server-only';

import { cache } from 'react';
import { z } from 'zod';

import { CACHE_TAGS, categoryDtoSchema, type CategoryType } from '@codex/shared';

import { apiFetch } from './client';

/** Categories of one type (portfolio filters, blog categories), in display order. */
export const getCategories = cache(
  async (type: CategoryType) =>
    (
      await apiFetch({
        path: '/public/categories',
        query: { type },
        schema: z.array(categoryDtoSchema),
        tags: [CACHE_TAGS.CATEGORIES],
      })
    ).data,
);
