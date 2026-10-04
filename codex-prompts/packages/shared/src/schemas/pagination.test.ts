import { describe, expect, it } from 'vitest';

import { createSortSchema, dateRangeQuerySchema, paginationSchema } from './pagination.js';
import { PAGINATION } from '../constants/pagination.js';
import { VALIDATION_MESSAGES as MSG } from '../constants/validation-messages.js';
import { issueMessages, issuesByPath } from '../test/issues.js';

describe('paginationSchema', () => {
  it('applies defaults', () => {
    expect(paginationSchema.parse({})).toEqual({
      page: PAGINATION.DEFAULT_PAGE,
      pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
    });
  });

  it('coerces query-string numbers', () => {
    expect(paginationSchema.parse({ page: '3', pageSize: '50' })).toEqual({
      page: 3,
      pageSize: 50,
    });
  });

  it.each([
    [{ page: '0' }, MSG.NUMBER_TOO_SMALL],
    [{ page: String(PAGINATION.MAX_PAGE + 1) }, MSG.NUMBER_TOO_BIG],
    [{ pageSize: '51' }, MSG.NUMBER_TOO_BIG],
    [{ pageSize: '0' }, MSG.NUMBER_TOO_SMALL],
    [{ page: '1.5' }, MSG.NOT_INTEGER],
    [{ page: 'abc' }, MSG.INVALID_TYPE],
  ])('rejects %o', (input, message) => {
    expect(issueMessages(paginationSchema, input)).toEqual([message]);
  });
});

describe('createSortSchema', () => {
  const schema = createSortSchema(['createdAt', 'order'], { sortBy: 'order', sortOrder: 'asc' });

  it('defaults and accepts allowed fields', () => {
    expect(schema.parse({})).toEqual({ sortBy: 'order', sortOrder: 'asc' });
    expect(schema.parse({ sortBy: 'createdAt', sortOrder: 'desc' })).toEqual({
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  });

  it('rejects fields outside the allow-list', () => {
    expect(issueMessages(schema, { sortBy: 'passwordHash' })).toEqual([MSG.INVALID_OPTION]);
  });
});

describe('dateRangeQuerySchema', () => {
  it('rejects a range that ends before it starts', () => {
    const input = { from: '2026-05-01T00:00:00Z', to: '2026-04-01T00:00:00Z' };

    expect(issuesByPath(dateRangeQuerySchema, input)).toEqual({ to: MSG.INVALID_DATE_RANGE });
  });

  it('accepts open-ended ranges', () => {
    expect(dateRangeQuerySchema.parse({ from: '2026-05-01T00:00:00+03:00' })).toEqual({
      from: '2026-05-01T00:00:00+03:00',
    });
  });
});
