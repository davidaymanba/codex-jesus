import { extractPlainText } from './rich-text-plain-text.js';
import type { Locale } from '../constants/locales.js';
import { READING_WORDS_PER_MINUTE } from '../constants/reading-time.js';
import type { RichTextDocument } from '../schemas/rich-text.js';

const WORD_SEPARATOR = /\s+/u;

/** Counts whitespace-separated words (works for Arabic and English). */
export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(WORD_SEPARATOR).length : 0;
}

/** Estimated reading time in whole minutes (at least 1) for a document in the given locale. */
export function calculateReadingTime(document: RichTextDocument, locale: Locale): number {
  const words = countWords(extractPlainText(document));
  return Math.max(1, Math.ceil(words / READING_WORDS_PER_MINUTE[locale]));
}
