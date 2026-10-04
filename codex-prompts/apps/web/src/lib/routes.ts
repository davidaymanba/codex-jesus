import type { Locale, ServiceCategory } from '@codex/shared';

/** Site paths without the locale prefix (English segments in both locales). */
export const ROUTES = {
  HOME: '/',
  SERVICES: '/services',
  PORTFOLIO: '/portfolio',
  BLOG: '/blog',
  ABOUT: '/about',
  CONTACT: '/contact',
  QUOTE: '/quote',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  DEV_SHOWCASE: '/dev/ui',
} as const;

/** Anything with both locale slugs (every public content DTO). */
export interface LocalizedSlugs {
  slugAr: string;
  slugEn: string;
}

/** The record's slug in `locale`. */
export const slugIn = ({ slugAr, slugEn }: LocalizedSlugs, locale: Locale): string =>
  locale === 'ar' ? slugAr : slugEn;

export const serviceRoute = (slug: string): string => `${ROUTES.SERVICES}/${slug}`;
export const projectRoute = (slug: string): string => `${ROUTES.PORTFOLIO}/${slug}`;
export const postRoute = (slug: string): string => `${ROUTES.BLOG}/${slug}`;
export const blogCategoryRoute = (slug: string): string => `${ROUTES.BLOG}/category/${slug}`;
export const blogRssRoute = `${ROUTES.BLOG}/rss.xml`;

/** Stable in-page anchor of a pillar on /services (the footer links there without the API). */
export const pillarAnchor = (category: ServiceCategory): string => category.toLowerCase();
export const pillarRoute = (category: ServiceCategory): string =>
  `${ROUTES.SERVICES}#${pillarAnchor(category)}`;

/** The quote form, with services preselected (`?service=` takes an offering or a pillar). */
export const quoteRoute = (service?: string): string =>
  service ? `${ROUTES.QUOTE}?service=${encodeURIComponent(service)}` : ROUTES.QUOTE;

/** `path` per locale for a record whose URL uses its localized slug. */
export function localizedPaths(
  record: LocalizedSlugs,
  toPath: (slug: string) => string,
): Record<Locale, string> {
  return { ar: toPath(record.slugAr), en: toPath(record.slugEn) };
}

/** Main navigation, in order; "services" also opens a dropdown of the published services. */
export const MAIN_NAV = [
  { key: 'home', href: ROUTES.HOME },
  { key: 'services', href: ROUTES.SERVICES },
  { key: 'portfolio', href: ROUTES.PORTFOLIO },
  { key: 'blog', href: ROUTES.BLOG },
  { key: 'about', href: ROUTES.ABOUT },
  { key: 'contact', href: ROUTES.CONTACT },
] as const;

export type MainNavKey = (typeof MAIN_NAV)[number]['key'];
