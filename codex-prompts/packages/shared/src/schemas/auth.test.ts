import { describe, expect, it } from 'vitest';

import { changePasswordSchema, loginSchema } from './auth.js';
import { hasPermission, Permission, ROLE_PERMISSIONS } from '../constants/permissions.js';
import { VALIDATION_MESSAGES as MSG } from '../constants/validation-messages.js';
import { Role } from '../enums/role.js';
import { issuesByPath } from '../test/issues.js';

describe('loginSchema', () => {
  it('normalizes the email and never policy-checks the password', () => {
    expect(loginSchema.parse({ email: ' Sara@Codex.Example ', password: 'short' })).toEqual({
      email: 'sara@codex.example',
      password: 'short',
    });
  });

  it('requires both fields and strips unknown ones', () => {
    expect(issuesByPath(loginSchema, { email: 'x@codex.example', password: '' })).toEqual({
      password: MSG.REQUIRED,
    });
    expect(loginSchema.parse({ email: 'x@codex.example', password: 'p', role: 'ADMIN' })).toEqual({
      email: 'x@codex.example',
      password: 'p',
    });
  });
});

describe('changePasswordSchema', () => {
  it('applies the policy to the new password and rejects reusing the current one', () => {
    expect(
      issuesByPath(changePasswordSchema, { currentPassword: 'x', newPassword: 'short' }),
    ).toEqual({
      newPassword: MSG.PASSWORD_TOO_SHORT,
    });
    const same = 'Tide-Lantern-47';
    expect(
      issuesByPath(changePasswordSchema, { currentPassword: same, newPassword: same }),
    ).toEqual({
      newPassword: MSG.PASSWORD_UNCHANGED,
    });
  });
});

describe('permission matrix', () => {
  it('gives ADMIN everything', () => {
    expect(ROLE_PERMISSIONS[Role.ADMIN]).toEqual(Object.values(Permission));
  });

  it('limits EDITOR to content, media and lead handling', () => {
    expect(hasPermission(Role.EDITOR, Permission.CONTENT_MANAGE)).toBe(true);
    expect(hasPermission(Role.EDITOR, Permission.LEADS_UPDATE)).toBe(true);
    expect(hasPermission(Role.EDITOR, Permission.USERS_MANAGE)).toBe(false);
    expect(hasPermission(Role.EDITOR, Permission.SETTINGS_MANAGE)).toBe(false);
    expect(hasPermission(Role.EDITOR, Permission.AUDIT_READ)).toBe(false);
  });

  it('denies unknown roles', () => {
    expect(hasPermission('OWNER' as Role, Permission.CONTENT_MANAGE)).toBe(false);
  });
});
