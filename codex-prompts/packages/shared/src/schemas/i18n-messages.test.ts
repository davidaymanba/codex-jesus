import { describe, expect, it } from 'vitest';
import type { z } from 'zod';

import * as schemas from './index.js';

const I18N_KEY = /^validation\.[a-zA-Z.]+$/;

/** Inputs that exercise missing top-level and nested fields. */
const PROBES: unknown[] = [
  undefined,
  {},
  { homepage: { hero: {}, cta: {} }, contact: {}, defaultSeo: {}, seo: {}, content: {} },
  { title: {}, subServices: [{}], faqs: [{}], results: [{}], socials: [{}], content: { ar: {} } },
  { page: 'x', pageSize: -1, sortBy: 'nope', from: 'yesterday' },
];

const isZodSchema = (value: unknown): value is z.ZodType =>
  typeof value === 'object' && value !== null && 'safeParse' in value;

// API response envelopes validate our own output, not user input, so their messages stay raw.
const RESPONSE_SCHEMAS = new Set([
  'paginationMetaSchema',
  'apiErrorSchema',
  'validationIssueSchema',
  'authUserSchema',
]);

const exportedSchemas = Object.entries(schemas as Record<string, unknown>).filter(
  (entry): entry is [string, z.ZodType] =>
    entry[0].endsWith('Schema') && !RESPONSE_SCHEMAS.has(entry[0]) && isZodSchema(entry[1]),
);

describe('every exported schema reports i18n keys, never raw zod messages', () => {
  it('finds the schemas', () => {
    expect(exportedSchemas.length).toBeGreaterThan(40);
  });

  it.each(exportedSchemas)('%s', (_name, schema) => {
    for (const probe of PROBES) {
      const result = schema.safeParse(probe);
      const messages = result.success ? [] : result.error.issues.map((issue) => issue.message);

      for (const message of messages) expect(message).toMatch(I18N_KEY);
    }
  });
});
