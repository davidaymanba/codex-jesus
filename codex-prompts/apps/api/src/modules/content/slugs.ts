import {
  FIELD_LIMITS,
  slugifyArabic,
  slugifyEnglish,
  VALIDATION_MESSAGES as MSG,
  type Locale,
  type LocalizedString,
} from '@codex/shared';

import { ConflictError } from '@/lib/errors.js';

export type SlugField = 'slugAr' | 'slugEn';

/** The slug column public detail routes look `:slug` up in (`?locale=`). */
export const slugFieldOf = (locale: Locale): SlugField => (locale === 'ar' ? 'slugAr' : 'slugEn');

/** Implemented by every repository whose table has `slugAr` / `slugEn` unique columns. */
export interface SlugLookup {
  /** Existing slugs equal to or starting with `base`, excluding the record being edited. */
  takenSlugs(field: SlugField, base: string, excludeId?: string): Promise<string[]>;
}

export interface Slugs {
  slugAr: string;
  slugEn: string;
}

/** Slugs as sent by the admin: either may be omitted. */
export interface RequestedSlugs {
  slugAr?: string | undefined;
  slugEn?: string | undefined;
}

// Room for "-<n>" suffixes on generated slugs.
const SUFFIX_ROOM = 6;
const BASE_MAX_LENGTH = FIELD_LIMITS.SLUG_MAX - SUFFIX_ROOM;
// English titles made only of non-Latin characters still need an English URL.
const FALLBACK_BASE = 'untitled';

async function firstFreeSlug(
  lookup: SlugLookup,
  field: SlugField,
  base: string,
  excludeId?: string,
): Promise<string> {
  const taken = new Set(await lookup.takenSlugs(field, base, excludeId));
  if (!taken.has(base)) return base;
  for (let suffix = 2; ; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
}

async function assertFree(
  lookup: SlugLookup,
  field: SlugField,
  slug: string,
  excludeId?: string,
): Promise<string> {
  const taken = await lookup.takenSlugs(field, slug, excludeId);
  if (taken.includes(slug)) throw new ConflictError([{ path: field, message: MSG.SLUG_TAKEN }]);
  return slug;
}

/**
 * Slugs for a new record: an explicit slug must be free (409 otherwise); a missing one is
 * derived from the title in its locale (Arabic-safe) with a `-2`, `-3`… suffix when taken.
 */
export async function slugsForCreate(
  lookup: SlugLookup,
  title: LocalizedString,
  requested: RequestedSlugs,
): Promise<Slugs> {
  const englishBase = slugifyEnglish(title.en, BASE_MAX_LENGTH) || FALLBACK_BASE;
  const arabicBase = slugifyArabic(title.ar, BASE_MAX_LENGTH) || englishBase;
  const [slugAr, slugEn] = await Promise.all([
    requested.slugAr
      ? assertFree(lookup, 'slugAr', requested.slugAr)
      : firstFreeSlug(lookup, 'slugAr', arabicBase),
    requested.slugEn
      ? assertFree(lookup, 'slugEn', requested.slugEn)
      : firstFreeSlug(lookup, 'slugEn', englishBase),
  ]);
  return { slugAr, slugEn };
}

/**
 * Slug changes on update are explicit only: renaming a title never moves a published URL.
 * Returns only the slugs that were sent, after checking they are free.
 */
export async function slugsForUpdate(
  lookup: SlugLookup,
  id: string,
  requested: RequestedSlugs,
): Promise<Partial<Slugs>> {
  const [slugAr, slugEn] = await Promise.all([
    requested.slugAr ? assertFree(lookup, 'slugAr', requested.slugAr, id) : undefined,
    requested.slugEn ? assertFree(lookup, 'slugEn', requested.slugEn, id) : undefined,
  ]);
  return { ...(slugAr && { slugAr }), ...(slugEn && { slugEn }) };
}

/** Prisma `where` for `takenSlugs` implementations. */
export function slugPrefixWhere(field: SlugField, base: string, excludeId?: string) {
  const prefix = { startsWith: base };
  return {
    ...(field === 'slugAr' ? { slugAr: prefix } : { slugEn: prefix }),
    ...(excludeId && { NOT: { id: excludeId } }),
  };
}
