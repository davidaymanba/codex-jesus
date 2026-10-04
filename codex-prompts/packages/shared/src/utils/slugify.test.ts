import { describe, expect, it } from 'vitest';

import { slugifyArabic, slugifyEnglish } from './slugify.js';
import { slugArSchema, slugEnSchema } from '../schemas/common.js';

describe('slugifyArabic', () => {
  it.each([
    ['تطوير المتاجر الإلكترونيَّة', 'تطوير-المتاجر-الإلكترونية'],
    ['مُــتَــجَــر', 'متجر'],
    ['  أتمتة n8n — للأعمال!  ', 'أتمتة-n8n-للأعمال'],
    ['هوية ٢٠٢٦', 'هوية-٢٠٢٦'],
  ])('%s → %s', (title, slug) => {
    expect(slugifyArabic(title)).toBe(slug);
    expect(slugArSchema.safeParse(slug).success).toBe(true);
  });

  it('caps the length at a word boundary', () => {
    const slug = slugifyArabic('كلمة '.repeat(40), 20);
    expect(slug.length).toBeLessThanOrEqual(20);
    expect(slug.endsWith('-')).toBe(false);
  });
});

describe('slugifyEnglish', () => {
  it.each([
    ['Café & Brand Identity', 'cafe-brand-identity'],
    ['  E-commerce -- Stores 2026 ', 'e-commerce-stores-2026'],
    ['تطوير Salla متاجر', 'salla'],
    ['تطوير', ''],
  ])('%s → %s', (title, slug) => {
    expect(slugifyEnglish(title)).toBe(slug);
    if (slug) expect(slugEnSchema.safeParse(slug).success).toBe(true);
  });
});
