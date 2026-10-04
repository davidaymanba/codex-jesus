import { ERROR_MESSAGES, VALIDATION_MESSAGES } from '@codex/shared/constants';

import type { FieldErrorKey } from '@/components/ui/FormField';

const KNOWN_KEYS = new Set<string>([
  ...Object.values(VALIDATION_MESSAGES),
  ...Object.values(ERROR_MESSAGES),
]);

const isFieldErrorKey = (message: string): message is FieldErrorKey => KNOWN_KEYS.has(message);

/**
 * A form error as an i18n key. Shared schemas and the API only produce known keys; anything
 * else (a library default) shows the generic "not valid" text rather than raw English.
 */
export function toErrorKey(message: string | undefined): FieldErrorKey | undefined {
  if (message === undefined || message === '') return undefined;
  return isFieldErrorKey(message) ? message : VALIDATION_MESSAGES.INVALID_TYPE;
}
