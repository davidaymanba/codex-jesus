import { RTL_LOCALES, type Locale, type LocalizedTextDto } from '@codex/shared';

/** The value of a bilingual API field in the current locale. */
export function localized(text: LocalizedTextDto, locale: Locale): string {
  return text[locale];
}

/** `dir` attribute for a locale. */
export const directionOf = (locale: Locale): 'rtl' | 'ltr' =>
  RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';
