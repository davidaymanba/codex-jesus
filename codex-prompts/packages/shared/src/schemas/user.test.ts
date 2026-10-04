import { describe, expect, it } from 'vitest';

import {
  createUserSchema,
  isPasswordRelatedToEmail,
  passwordSchema,
  updateUserSchema,
} from './user.js';
import { VALIDATION_MESSAGES as MSG } from '../constants/validation-messages.js';
import { issueMessages, issuesByPath } from '../test/issues.js';

const STRONG = 'Tide-Lantern-47';

describe('passwordSchema', () => {
  it('accepts a long password without composition rules', () => {
    expect(passwordSchema.parse(STRONG)).toBe(STRONG);
    expect(passwordSchema.parse('correct horse battery staple')).toBe(
      'correct horse battery staple',
    );
  });

  it.each([
    ['Short-1', MSG.PASSWORD_TOO_SHORT],
    ['A1-'.repeat(43), MSG.TOO_LONG],
  ])('rejects %s', (password, message) => {
    expect(issueMessages(passwordSchema, password)).toEqual([message]);
  });

  it('does not trim (whitespace is part of the secret)', () => {
    expect(passwordSchema.parse(` ${STRONG} `)).toBe(` ${STRONG} `);
  });
});

describe('createUserSchema', () => {
  const valid = { name: 'Sara Ahmed', email: 'Sara@Codex.example', password: STRONG };

  it('applies safe defaults', () => {
    expect(createUserSchema.parse(valid)).toEqual({
      name: 'Sara Ahmed',
      email: 'sara@codex.example',
      password: STRONG,
      role: 'EDITOR',
      isActive: true,
    });
  });

  it('rejects a password containing the email local part', () => {
    expect(issuesByPath(createUserSchema, { ...valid, password: 'Sara-Strong-2026' })).toEqual({
      password: MSG.PASSWORD_CONTAINS_EMAIL,
    });
    expect(isPasswordRelatedToEmail('xy-Strong-2026', 'xy@codex.example')).toBe(false);
  });

  it('never accepts a password on update', () => {
    expect(updateUserSchema.parse({ password: STRONG, role: 'ADMIN' })).toEqual({ role: 'ADMIN' });
  });
});
