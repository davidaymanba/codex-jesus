import { describe, expect, it } from 'vitest';

import { withoutUndefined } from './objects.js';

describe('withoutUndefined', () => {
  it('keeps null and falsy values, drops undefined ones', () => {
    expect(withoutUndefined({ a: undefined, b: null, c: 0, d: '' })).toEqual({
      b: null,
      c: 0,
      d: '',
    });
  });
});
