import { z } from 'zod';

import { requiredOrInvalidType, requiredString } from './common.js';

interface LocalizedStringOptions {
  /** Minimum trimmed length per locale. Defaults to 1 (required). */
  min?: number;
  /** Maximum length per locale. Required so every string has an upper bound. */
  max: number;
}

/**
 * Builds a schema for text stored in both locales, e.g. `{ ar: 'خدماتنا', en: 'Our services' }`.
 * Unknown keys are stripped.
 */
export function createLocalizedStringSchema(options: LocalizedStringOptions) {
  return z.object(
    {
      ar: requiredString(options),
      en: requiredString(options),
    },
    { error: requiredOrInvalidType },
  );
}

/** Default localized string: required in both locales, up to 255 characters. */
export const localizedStringSchema = createLocalizedStringSchema({ max: 255 });

export type LocalizedString = z.infer<typeof localizedStringSchema>;
