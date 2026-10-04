import 'server-only';

import { cache } from 'react';
import { z } from 'zod';

import {
  CACHE_TAGS,
  postDtoSchema,
  postSummaryDtoSchema,
  type Locale,
  type PostDto,
} from '@codex/shared';

import { apiFetch } from './client';
import { findOrNull, slugSegment } from './lookup';

const POST_TAGS = [CACHE_TAGS.POSTS, CACHE_TAGS.CATEGORIES, CACHE_TAGS.TAGS, CACHE_TAGS.MEDIA];

export interface PostFilters {
  /** Category slug in either locale. */
  category?: string | undefined;
  /** Tag slug in either locale. */
  tag?: string | undefined;
  isFeatured?: boolean | undefined;
  /** Full-text search (server side). */
  query?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

/** A page of published posts, newest first (cards only). */
export const getPosts = cache(
  ({ category, tag, isFeatured, query, page, pageSize }: PostFilters = {}) =>
    apiFetch({
      path: '/public/posts',
      query: { category, tag, featured: isFeatured, q: query, page, pageSize },
      schema: z.array(postSummaryDtoSchema),
      tags: POST_TAGS,
    }),
);

/** One published post by its slug in `locale`; `null` if there is none. */
export const getPost = cache((slug: string, locale: Locale): Promise<PostDto | null> =>
  findOrNull(
    async () =>
      (
        await apiFetch({
          path: `/public/posts/${slugSegment(slug)}`,
          query: { locale },
          schema: postDtoSchema,
          tags: POST_TAGS,
        })
      ).data,
  ),
);

/** Posts sharing a category or tag with the given one (filled up with the latest). */
export const getRelatedPosts = cache(
  async (slug: string, locale: Locale) =>
    (
      await apiFetch({
        path: `/public/posts/${slugSegment(slug)}/related`,
        query: { locale },
        schema: z.array(postSummaryDtoSchema),
        tags: POST_TAGS,
      })
    ).data,
);
