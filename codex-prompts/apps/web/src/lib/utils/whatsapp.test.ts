import { describe, expect, it } from 'vitest';

import { whatsAppHref } from './whatsapp';

describe('whatsAppHref', () => {
  it('keeps only the digits of the number and encodes the localized message', () => {
    expect(whatsAppHref('+966 50 123 4567', 'مرحبًا Codex & team')).toBe(
      'https://wa.me/966501234567?text=%D9%85%D8%B1%D8%AD%D8%A8%D9%8B%D8%A7+Codex+%26+team',
    );
  });
});
