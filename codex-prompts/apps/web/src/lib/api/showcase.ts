import 'server-only';

import { cache } from 'react';
import { z } from 'zod';

import {
  CACHE_TAGS,
  clientDtoSchema,
  PAGINATION,
  teamMemberDtoSchema,
  testimonialDtoSchema,
} from '@codex/shared';

import { apiFetch } from './client';

// Small, admin-curated collections: one page holds all of them.
const ALL = { pageSize: PAGINATION.MAX_PAGE_SIZE };

export const getTestimonials = cache(
  async () =>
    (
      await apiFetch({
        path: '/public/testimonials',
        query: ALL,
        schema: z.array(testimonialDtoSchema),
        tags: [CACHE_TAGS.TESTIMONIALS, CACHE_TAGS.MEDIA],
      })
    ).data,
);

export const getClients = cache(
  async () =>
    (
      await apiFetch({
        path: '/public/clients',
        query: ALL,
        schema: z.array(clientDtoSchema),
        tags: [CACHE_TAGS.CLIENTS, CACHE_TAGS.MEDIA],
      })
    ).data,
);

export const getTeamMembers = cache(
  async () =>
    (
      await apiFetch({
        path: '/public/team',
        query: ALL,
        schema: z.array(teamMemberDtoSchema),
        tags: [CACHE_TAGS.TEAM, CACHE_TAGS.MEDIA],
      })
    ).data,
);
