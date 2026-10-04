import type { Locale } from '@codex/shared';

const dateFormatters = new Map<Locale, Intl.DateTimeFormat>();

/** A calendar date in the locale's long format ("8 September 2026" / "٨ سبتمبر ٢٠٢٦"). */
export function formatDate(iso: string, locale: Locale): string {
  let formatter = dateFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' });
    dateFormatters.set(locale, formatter);
  }
  return formatter.format(new Date(iso));
}
