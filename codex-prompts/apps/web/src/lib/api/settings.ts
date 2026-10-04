import 'server-only';

import { cache } from 'react';

import { CACHE_TAGS, siteSettingsDtoSchema, type SiteSettingsDto } from '@codex/shared';

import { apiFetch } from './client';
import { withFallback } from './fallback';

/**
 * Site settings (contact, socials, default SEO), fetched once per request (React `cache`)
 * and kept in the Next.js data cache under the `settings` tag. `null` when the API is
 * unreachable: the layout still renders, without the parts that need settings.
 */
export const getSiteSettings = cache((): Promise<SiteSettingsDto | null> =>
  withFallback(
    'site-settings',
    async () =>
      (
        await apiFetch({
          path: '/public/settings',
          schema: siteSettingsDtoSchema,
          tags: [CACHE_TAGS.SETTINGS, CACHE_TAGS.MEDIA],
        })
      ).data,
    null,
  ),
);
