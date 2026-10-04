import { describe, expect, it } from 'vitest';

import { AUDIT_VALUE_MAX_LENGTH } from '@/config/constants.js';

import { diffChanges, sanitizeChanges } from './audit-log.service.js';

describe('sanitizeChanges', () => {
  it('removes secrets at any depth and keeps everything else', () => {
    expect(
      sanitizeChanges({
        name: 'Sara',
        password: 'x',
        nested: { passwordHash: 'y', tokens: [{ refreshToken: 'z', ok: true }] },
      }),
    ).toEqual({
      name: 'Sara',
      password: '[REMOVED]',
      nested: { passwordHash: '[REMOVED]', tokens: [{ refreshToken: '[REMOVED]', ok: true }] },
    });
  });

  it('truncates oversized strings and returns null for nothing', () => {
    expect(sanitizeChanges({ body: 'x'.repeat(AUDIT_VALUE_MAX_LENGTH + 1) })).toEqual({
      body: '[TRUNCATED]',
    });
    expect(sanitizeChanges(undefined)).toBeNull();
  });
});

describe('diffChanges', () => {
  it('lists only changed fields, comparing nested values by content', () => {
    const before = { title: { ar: 'أ', en: 'A' }, status: 'DRAFT', order: 1 };
    const after = { title: { ar: 'أ', en: 'A' }, status: 'PUBLISHED', order: 1 };

    expect(diffChanges(before, after)).toEqual({ status: { from: 'DRAFT', to: 'PUBLISHED' } });
  });
});
