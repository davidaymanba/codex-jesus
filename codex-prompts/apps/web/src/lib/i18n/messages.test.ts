import { describe, expect, it } from 'vitest';

import { ERROR_MESSAGES, LOCALES, VALIDATION_MESSAGES } from '@codex/shared';

import ar from '../../messages/ar.json';
import en from '../../messages/en.json';

const CATALOGS = { ar, en } satisfies Record<(typeof LOCALES)[number], object>;

/** Every `a.b.c` key of a nested messages object, with its value. */
function leaves(node: unknown, prefix = ''): [string, unknown][] {
  if (typeof node !== 'object' || node === null) return [[prefix, node]];
  return Object.entries(node).flatMap(([key, child]) =>
    leaves(child, prefix ? `${prefix}.${key}` : key),
  );
}

const keysOf = (catalog: object) => new Map(leaves(catalog));

describe('message catalogs', () => {
  it.each(LOCALES)('%s has a text for every validation and error key the API sends', (locale) => {
    const keys = keysOf(CATALOGS[locale]);
    const missing = [
      ...Object.values(VALIDATION_MESSAGES),
      ...Object.values(ERROR_MESSAGES),
    ].filter((key) => typeof keys.get(key) !== 'string');
    expect(missing).toEqual([]);
  });

  it('has the same keys in Arabic and English', () => {
    expect([...keysOf(ar).keys()].sort()).toEqual([...keysOf(en).keys()].sort());
  });

  it.each(LOCALES)('%s has no empty texts', (locale) => {
    const empty = leaves(CATALOGS[locale]).filter(
      ([, value]) => typeof value !== 'string' || value.trim() === '',
    );
    expect(empty).toEqual([]);
  });
});
