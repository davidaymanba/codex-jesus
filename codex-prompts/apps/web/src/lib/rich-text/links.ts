import { LOCALES, RICH_TEXT_LINK_PROTOCOLS, type Locale } from '@codex/shared/constants';

export type SafeLink =
  | { kind: 'internal'; href: string }
  | { kind: 'external'; href: string }
  | { kind: 'contact'; href: string };

const hasLocalePrefix = (path: string) =>
  LOCALES.some((locale) => path === `/${locale}` || path.startsWith(`/${locale}/`));

/**
 * Classifies a stored link href, or `null` when it must not be rendered as a link (unknown
 * protocol such as `javascript:`, protocol-relative `//host`, unparsable). Site paths get the
 * current locale's prefix unless they already carry one.
 */
export function toSafeLink(href: string, locale: Locale): SafeLink | null {
  const trimmed = href.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return { kind: 'internal', href: hasLocalePrefix(trimmed) ? trimmed : `/${locale}${trimmed}` };
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (!(RICH_TEXT_LINK_PROTOCOLS as readonly string[]).includes(url.protocol)) return null;
  const kind = url.protocol === 'mailto:' || url.protocol === 'tel:' ? 'contact' : 'external';
  return { kind, href: url.toString() };
}
