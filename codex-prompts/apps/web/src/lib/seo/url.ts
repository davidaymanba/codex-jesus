import type { Locale, MediaDto } from '@codex/shared';

import { clientEnv } from '@/env/client';

import { localizedPath, type MetadataInput } from './metadata';

/** Absolute URL on this site (JSON-LD, sitemap and feeds need them; non-ASCII is encoded). */
export const absoluteUrl = (path: string): string =>
  new URL(path, clientEnv.NEXT_PUBLIC_SITE_URL).toString();

/** Absolute URL of a page in `locale`. */
export const localizedUrl = (locale: Locale, path: string): string =>
  absoluteUrl(localizedPath(locale, path));

/** A content image as the Open Graph image of its page. */
export function ogImageOf(
  media: MediaDto | null | undefined,
  locale: Locale,
): MetadataInput['image'] {
  return media
    ? { url: media.url, width: media.width, height: media.height, alt: media.alt[locale] }
    : undefined;
}
