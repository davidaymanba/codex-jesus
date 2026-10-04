import { PAGINATION, type CategoryDto, type Locale } from '@codex/shared';

import { slugIn } from '@/lib/routes';

/** Next.js search params as a page receives them. */
export type SearchParams = Record<string, string | string[] | undefined>;

/** A search param's single value (the first one when repeated). */
export const firstParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/**
 * `?page=`: 1 when absent, `null` when it is not a whole number in range (the page answers
 * 404 rather than serving duplicate content under junk URLs).
 */
export function parsePage(value: string | string[] | undefined): number | null {
  const raw = firstParam(value);
  if (raw === undefined) return PAGINATION.DEFAULT_PAGE;
  if (!/^\d+$/.test(raw)) return null;
  const page = Number(raw);
  return page >= 1 && page <= PAGINATION.MAX_PAGE ? page : null;
}

export type CategoryMatch =
  | { kind: 'none' }
  | { kind: 'found'; category: CategoryDto }
  | { kind: 'other-locale'; category: CategoryDto }
  | { kind: 'unknown' };

/**
 * The category a `?category=` slug names: in this locale, in the other one (the page then
 * redirects to this locale's slug), or unknown (404).
 */
export function matchCategory(
  categories: CategoryDto[],
  slug: string | undefined,
  locale: Locale,
): CategoryMatch {
  if (slug === undefined) return { kind: 'none' };
  const inLocale = categories.find((category) => slugIn(category, locale) === slug);
  if (inLocale) return { kind: 'found', category: inLocale };
  const elsewhere = categories.find(({ slugAr, slugEn }) => slug === slugAr || slug === slugEn);
  return elsewhere ? { kind: 'other-locale', category: elsewhere } : { kind: 'unknown' };
}

/** `path?key=value&…` without empty values; page 1 is left out (one URL per page). */
export function listHref(path: string, query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '' || (key === 'page' && value === 1)) continue;
    params.set(key, String(value));
  }
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}
