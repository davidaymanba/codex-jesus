import { describe, expect, it } from 'vitest';

import type { CategoryDto } from '@codex/shared';

import { listHref, matchCategory, parsePage } from './list-params';

const category: CategoryDto = {
  id: '00000000-0000-4000-8000-000000000001',
  name: { ar: 'التجارة الإلكترونية', en: 'E-commerce' },
  slugAr: 'التجارة-الإلكترونية',
  slugEn: 'e-commerce',
  type: 'PROJECT',
};

describe('parsePage', () => {
  it('defaults to 1 and accepts whole numbers in range', () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage('3')).toBe(3);
    expect(parsePage(['2', '5'])).toBe(2);
  });

  it('rejects junk, zero and out-of-range pages', () => {
    for (const value of ['0', '-1', '1.5', 'abc', '', '1001', '2e3']) {
      expect(parsePage(value)).toBeNull();
    }
  });
});

describe('matchCategory', () => {
  it('finds a slug in the locale, flags the other locale, rejects unknown slugs', () => {
    expect(matchCategory([category], undefined, 'en')).toEqual({ kind: 'none' });
    expect(matchCategory([category], 'e-commerce', 'en')).toEqual({ kind: 'found', category });
    expect(matchCategory([category], 'e-commerce', 'ar')).toEqual({
      kind: 'other-locale',
      category,
    });
    expect(matchCategory([category], 'nope', 'en')).toEqual({ kind: 'unknown' });
  });
});

describe('listHref', () => {
  it('drops empty values and page 1', () => {
    expect(listHref('/blog', { category: undefined, page: 1 })).toBe('/blog');
    expect(listHref('/blog', { q: 'seo tips', page: 2 })).toBe('/blog?q=seo+tips&page=2');
  });
});
