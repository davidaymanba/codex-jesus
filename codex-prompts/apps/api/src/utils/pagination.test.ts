import { describe, expect, it } from 'vitest';

import { paginate, toPageArgs, toPaginationMeta } from './pagination.js';

describe('pagination helpers', () => {
  it('maps a page to skip/take', () => {
    expect(toPageArgs({ page: 1, pageSize: 12 })).toEqual({ skip: 0, take: 12 });
    expect(toPageArgs({ page: 3, pageSize: 10 })).toEqual({ skip: 20, take: 10 });
  });

  it('builds response meta', () => {
    expect(toPaginationMeta(25, { page: 2, pageSize: 12 })).toEqual({
      page: 2,
      pageSize: 12,
      total: 25,
      totalPages: 3,
    });
    expect(toPaginationMeta(0, { page: 1, pageSize: 12 }).totalPages).toBe(0);
  });

  it('paginate combines page args and meta', () => {
    const { skip, take, toMeta } = paginate({ page: 2, pageSize: 10 });
    expect({ skip, take }).toEqual({ skip: 10, take: 10 });
    expect(toMeta(31)).toEqual({ page: 2, pageSize: 10, total: 31, totalPages: 4 });
  });
});
