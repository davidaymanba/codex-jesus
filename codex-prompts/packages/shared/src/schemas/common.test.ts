import { describe, expect, it } from 'vitest';

import {
  booleanQuerySchema,
  emailSchema,
  emptyToUndefined,
  httpUrlSchema,
  idSchema,
  internalPathSchema,
  personNameSchema,
  phoneSchema,
  slugArSchema,
  slugEnSchema,
  uniqueArray,
} from './common.js';
import { VALIDATION_MESSAGES as MSG } from '../constants/validation-messages.js';
import { issueMessages } from '../test/issues.js';

describe('emailSchema', () => {
  it('trims and lowercases', () => {
    expect(emailSchema.parse('  Hello@Codex.CO ')).toBe('hello@codex.co');
  });

  it.each([['not-an-email'], ['a@b'], ['@codex.co']])('rejects %s', (input) => {
    expect(issueMessages(emailSchema, input)).toEqual([MSG.INVALID_EMAIL]);
  });

  it('reports a missing value as required', () => {
    expect(issueMessages(emailSchema, undefined)).toEqual([MSG.REQUIRED]);
  });
});

describe('phoneSchema', () => {
  it.each([
    ['+966 50 123 4567', '+966501234567'],
    ['+20 (100) 123-4567', '+201001234567'],
    ['+14155552671', '+14155552671'],
  ])('normalizes %s to E.164', (input, expected) => {
    expect(phoneSchema.parse(input)).toBe(expected);
  });

  it.each([['0501234567'], ['+0123'], ['phone'], ['+1234567890123456']])('rejects %s', (input) => {
    expect(issueMessages(phoneSchema, input)).toEqual([MSG.INVALID_PHONE]);
  });
});

describe('slugs', () => {
  it('accepts kebab-case English slugs and lowercases them', () => {
    expect(slugEnSchema.parse('Salla-Store-Launch')).toBe('salla-store-launch');
  });

  it.each([['with space'], ['double--hyphen'], ['-leading'], ['trailing-'], ['عربي']])(
    'rejects %s as an English slug',
    (input) => {
      expect(issueMessages(slugEnSchema, input)).toEqual([MSG.INVALID_SLUG]);
    },
  );

  it('accepts Arabic letters, digits and Latin in Arabic slugs', () => {
    expect(slugArSchema.parse('متجر-سلة-2026')).toBe('متجر-سلة-2026');
  });

  it.each([['متجر سلة'], ['متجر--سلة'], ['متجر/سلة'], ['<script>']])(
    'rejects %s as an Arabic slug',
    (input) => {
      expect(issueMessages(slugArSchema, input)).toEqual([MSG.INVALID_SLUG]);
    },
  );
});

describe('httpUrlSchema', () => {
  it('accepts http and https', () => {
    expect(httpUrlSchema.parse('https://codex.example/work')).toBe('https://codex.example/work');
  });

  it.each([['javascript:alert(1)'], ['ftp://files.example'], ['not a url']])(
    'rejects %s',
    (input) => {
      expect(issueMessages(httpUrlSchema, input)).toEqual([MSG.INVALID_URL]);
    },
  );
});

describe('internalPathSchema', () => {
  it.each([['/'], ['/quote'], ['/services/branding']])('accepts %s', (input) => {
    expect(internalPathSchema.parse(input)).toBe(input);
  });

  it.each([['quote'], ['//evil.example'], ['https://evil.example'], ['/Quote'], ['/a//b']])(
    'rejects %s',
    (input) => {
      expect(issueMessages(internalPathSchema, input)).toEqual([MSG.INVALID_PATH]);
    },
  );
});

describe('personNameSchema', () => {
  it('enforces 2–80 characters after trimming', () => {
    expect(issueMessages(personNameSchema, ' A ')).toEqual([MSG.TOO_SHORT]);
    expect(issueMessages(personNameSchema, 'a'.repeat(81))).toEqual([MSG.TOO_LONG]);
    expect(personNameSchema.parse('  سارة  ')).toBe('سارة');
  });

  it('distinguishes missing from wrong type', () => {
    expect(issueMessages(personNameSchema, undefined)).toEqual([MSG.REQUIRED]);
    expect(issueMessages(personNameSchema, 42)).toEqual([MSG.INVALID_TYPE]);
  });
});

describe('helpers', () => {
  it('idSchema accepts UUIDv7', () => {
    expect(idSchema.safeParse('01928f3e-7b1a-7c3d-8e4f-5a6b7c8d9e0f').success).toBe(true);
    expect(issueMessages(idSchema, '123')).toEqual([MSG.INVALID_ID]);
  });

  it('uniqueArray rejects duplicates and enforces bounds', () => {
    const schema = uniqueArray(idSchema, { min: 1, max: 2 });
    const id = '01928f3e-7b1a-7c3d-8e4f-5a6b7c8d9e0f';

    expect(issueMessages(schema, [id, id])).toEqual([MSG.DUPLICATE_ITEMS]);
    expect(issueMessages(schema, [])).toEqual([MSG.TOO_FEW_ITEMS]);
  });

  it('emptyToUndefined treats blank form fields as absent', () => {
    expect(emptyToUndefined(phoneSchema.optional()).parse('')).toBeUndefined();
  });

  it('booleanQuerySchema never coerces "false" to true', () => {
    expect(booleanQuerySchema.parse('false')).toBe(false);
    expect(booleanQuerySchema.parse('1')).toBe(true);
    expect(issueMessages(booleanQuerySchema, 'maybe')).toEqual([MSG.INVALID_OPTION]);
  });
});
