import { ZxcvbnFactory } from '@zxcvbn-ts/core';
import { adjacencyGraphs, dictionary } from '@zxcvbn-ts/language-common';

import {
  PASSWORD_CONTEXT_WORDS,
  PASSWORD_MIN_OWN_LETTERS,
  PASSWORD_MIN_STRENGTH_SCORE,
} from '@/config/constants.js';

// Built once: loading the dictionaries takes ~10ms, a check takes ~1ms.
const checker = new ZxcvbnFactory({ dictionary, graphs: adjacencyGraphs });

const WORD_SEPARATOR = /[^\p{L}\p{N}]+/u;
const NON_LETTERS = /[^\p{L}]+/gu;
const MIN_CONTEXT_WORD_LENGTH = 3;

/** `sara.ahmed@codex.co` and `Sara Ahmed` → `sara`, `ahmed`, `codex`… (plus the originals). */
function contextWordsOf(context: readonly string[]): string[] {
  const words = context.flatMap((value) => [value, ...value.split(WORD_SEPARATOR)]);
  return [
    ...new Set(
      [...PASSWORD_CONTEXT_WORDS, ...words]
        .map((word) => word.toLowerCase())
        .filter((word) => word.length >= MIN_CONTEXT_WORD_LENGTH),
    ),
  ];
}

/**
 * zxcvbn only matches whole context tokens, so `sara.ahmed.2026` scores 4 for Sara Ahmed.
 * Removing every context word, digit and separator must leave some letters of the user's own.
 */
function isBuiltFromContext(password: string, words: readonly string[]): boolean {
  let rest = password.toLowerCase();
  for (const word of [...words].sort((a, b) => b.length - a.length)) {
    rest = rest.replaceAll(word, '');
  }
  return rest.replace(NON_LETTERS, '').length < PASSWORD_MIN_OWN_LETTERS;
}

/**
 * True when a password is too easy to guess: found in common-password lists, a keyboard or
 * date pattern, a repeat, or built from `context` (the user's email and name). Complements
 * the length-only shared `passwordSchema`; runs server-side because the dictionaries are large.
 */
export function isPasswordGuessable(password: string, context: readonly string[] = []): boolean {
  const words = contextWordsOf(context);
  if (isBuiltFromContext(password, words)) return true;
  return checker.check(password, words).score < PASSWORD_MIN_STRENGTH_SCORE;
}
