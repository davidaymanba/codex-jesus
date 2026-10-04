import { describe, expect, it } from 'vitest';

import { escapeLike } from './like.js';

describe('escapeLike', () => {
  it('escapes %, _ and the escape character itself', () => {
    expect(escapeLike('50%_off\\now')).toBe('50\\%\\_off\\\\now');
    expect(escapeLike('متجر')).toBe('متجر');
  });
});
