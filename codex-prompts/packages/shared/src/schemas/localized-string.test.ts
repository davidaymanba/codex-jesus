import { describe, expect, it } from 'vitest';

import { createLocalizedStringSchema, localizedStringSchema } from './localized-string.js';
import { VALIDATION_MESSAGES } from '../constants/validation-messages.js';

describe('localizedStringSchema', () => {
  it('accepts text in both locales and trims it', () => {
    const result = localizedStringSchema.parse({ ar: '  خدماتنا ', en: ' Our services ' });

    expect(result).toEqual({ ar: 'خدماتنا', en: 'Our services' });
  });

  it('strips unknown locales', () => {
    const result = localizedStringSchema.parse({ ar: 'مرحبا', en: 'Hello', fr: 'Bonjour' });

    expect(result).not.toHaveProperty('fr');
  });

  it('rejects a missing locale with an i18n key', () => {
    const result = localizedStringSchema.safeParse({ ar: 'مرحبا' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(VALIDATION_MESSAGES.REQUIRED);
  });

  it('rejects whitespace-only text as required', () => {
    const result = localizedStringSchema.safeParse({ ar: '   ', en: 'Hello' });

    expect(result.error?.issues[0]?.message).toBe(VALIDATION_MESSAGES.REQUIRED);
  });

  it('enforces the max length', () => {
    const schema = createLocalizedStringSchema({ max: 5 });
    const result = schema.safeParse({ ar: 'مرحبا', en: 'Hello world' });

    expect(result.error?.issues[0]?.message).toBe(VALIDATION_MESSAGES.TOO_LONG);
  });

  it('uses the too-short key when a custom minimum is set', () => {
    const schema = createLocalizedStringSchema({ min: 3, max: 10 });
    const result = schema.safeParse({ ar: 'اب', en: 'Hey' });

    expect(result.error?.issues[0]?.message).toBe(VALIDATION_MESSAGES.TOO_SHORT);
  });
});

describe('missing localized objects', () => {
  it('report required, not a raw zod message', () => {
    expect(localizedStringSchema.safeParse(undefined).error?.issues[0]?.message).toBe(
      VALIDATION_MESSAGES.REQUIRED,
    );
  });
});
