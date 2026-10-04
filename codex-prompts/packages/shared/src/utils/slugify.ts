import { FIELD_LIMITS } from '../constants/field-limits.js';

// Combining marks: Arabic harakat (fatha, damma, shadda…), Latin accents after NFKD. Arabic
// text is composed first (NFC), so hamza letters (أ إ آ ؤ ئ) keep their hamza.
const COMBINING_MARKS = /\p{M}+/gu;
// Tatweel (ـ) stretches Arabic words visually; it is a letter to Unicode but not to readers.
const TATWEEL = /ـ/g;
const NON_WORD = /[^\p{L}\p{N}]+/gu;
const EDGE_HYPHENS = /^-+|-+$/g;
const NON_LATIN = /[^a-z0-9-]+/g;
const NOTHING = /(?!)/g;

function toSlug(text: string, form: 'NFC' | 'NFKD', disallowed: RegExp): string {
  return text
    .normalize(form)
    .replace(COMBINING_MARKS, '')
    .replace(TATWEEL, '')
    .toLowerCase()
    .replace(NON_WORD, '-')
    .replace(disallowed, '-')
    .replace(/-{2,}/g, '-')
    .replace(EDGE_HYPHENS, '');
}

/** Cuts at the last hyphen within the limit, so slugs never end mid-word. */
function truncate(slug: string, max: number): string {
  if (slug.length <= max) return slug;
  const cut = slug.slice(0, max);
  const lastHyphen = cut.lastIndexOf('-');
  return (lastHyphen > 0 ? cut.slice(0, lastHyphen) : cut).replace(EDGE_HYPHENS, '');
}

/**
 * Arabic-safe slug: `"تطوير المتاجر الإلكترونيَّة"` → `"تطوير-المتاجر-الإلكترونية"`. Keeps
 * letters and digits of any script, drops diacritics and tatweel, joins words with single
 * hyphens and caps the length (matches `slugArSchema`). `maxLength` leaves room for suffixes.
 */
export function slugifyArabic(text: string, maxLength: number = FIELD_LIMITS.SLUG_MAX): string {
  return truncate(toSlug(text, 'NFC', NOTHING), maxLength);
}

/**
 * ASCII slug for English URLs: `"Café & Brand Identity"` → `"cafe-brand-identity"`
 * (matches `slugEnSchema`). Returns `''` when nothing Latin is left.
 */
export function slugifyEnglish(text: string, maxLength: number = FIELD_LIMITS.SLUG_MAX): string {
  return truncate(toSlug(text, 'NFKD', NON_LATIN), maxLength);
}
