import { describe, expect, it } from 'vitest';

import { calculateReadingTime, countWords } from './reading-time.js';
import { extractPlainText } from './rich-text-plain-text.js';
import { READING_WORDS_PER_MINUTE } from '../constants/reading-time.js';
import type { RichTextDocument } from '../schemas/rich-text.js';

const docOf = (...paragraphs: string[]): RichTextDocument => ({
  type: 'doc',
  content: paragraphs.map((text) => ({ type: 'paragraph', content: [{ type: 'text', text }] })),
});

describe('extractPlainText', () => {
  it('separates blocks so words never merge', () => {
    expect(extractPlainText(docOf('نهاية', 'بداية'))).toBe('نهاية\nبداية');
  });

  it('joins inline text within a paragraph', () => {
    const document: RichTextDocument = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Bold ' },
            { type: 'text', text: 'move', marks: [{ type: 'bold' }] },
          ],
        },
      ],
    };

    expect(extractPlainText(document)).toBe('Bold move');
  });
});

describe('calculateReadingTime', () => {
  it('counts Arabic and English words', () => {
    expect(countWords('  نبني متاجر إلكترونية  ')).toBe(3);
    expect(countWords('')).toBe(0);
  });

  it('uses the per-locale reading speed and rounds up', () => {
    const words = (count: number) => Array.from({ length: count }, () => 'word').join(' ');

    expect(calculateReadingTime(docOf(words(READING_WORDS_PER_MINUTE.en + 1)), 'en')).toBe(2);
    expect(calculateReadingTime(docOf(words(READING_WORDS_PER_MINUTE.ar)), 'ar')).toBe(1);
  });

  it('never returns less than one minute', () => {
    expect(calculateReadingTime(docOf('قصير'), 'ar')).toBe(1);
  });
});
