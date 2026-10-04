import { describe, expect, it } from 'vitest';

import { isPasswordGuessable } from './password-strength.js';

describe('isPasswordGuessable', () => {
  it.each([['Tide-Lantern-47'], ['correct horse battery staple'], ['h7#Kp2$vQ9!m']])(
    'accepts the strong password %s',
    (password) => {
      expect(isPasswordGuessable(password)).toBe(false);
    },
  );

  it.each([['Password1234!'], ['qwertyuiop123'], ['aaaaaaaaaaaa'], ['Summer2026!!!']])(
    'rejects the guessable password %s',
    (password) => {
      expect(isPasswordGuessable(password)).toBe(true);
    },
  );

  it('treats brand words and user context as guessable', () => {
    expect(isPasswordGuessable('CodexAdmin2026')).toBe(true);
    expect(isPasswordGuessable('Lantern2026!', ['lantern'])).toBe(true);
  });

  it('rejects passwords made only of the name and email parts, digits and separators', () => {
    const context = ['sara.ahmed@example.com', 'Sara Ahmed'];
    expect(isPasswordGuessable('sara.ahmed.2026', context)).toBe(true);
    expect(isPasswordGuessable('Ahmed-Sara-Codex-2026', context)).toBe(true);
    expect(isPasswordGuessable('Sara-Tide-Lantern-47', context)).toBe(false);
  });
});
