import type { Locale } from '@codex/shared';

import { ar } from './ar.js';
import { en } from './en.js';
import type { EmailMessages } from './types.js';

const MESSAGES: Record<Locale, EmailMessages> = { ar, en };

/** The email copy for a locale. */
export function messagesFor(locale: Locale): EmailMessages {
  return MESSAGES[locale];
}

export type { EmailMessages };
