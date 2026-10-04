import { describe, expect, it } from 'vitest';

import { PASSWORD_HASH_COST } from '@/config/constants.js';

import { hashPassword, isPasswordHashOutdated, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('uses argon2id with the configured cost and a random salt', async () => {
    const [first, second] = await Promise.all([
      hashPassword('Tide-Lantern-47'),
      hashPassword('Tide-Lantern-47'),
    ]);

    expect(first).toMatch(
      new RegExp(
        `^\\$argon2id\\$v=19\\$m=${PASSWORD_HASH_COST.MEMORY_KIB},p=${PASSWORD_HASH_COST.PARALLELISM},t=${PASSWORD_HASH_COST.TIME}\\$`,
      ),
    );
    expect(first).not.toBe(second);
  });

  it('verifies the right password only', async () => {
    const stored = await hashPassword('Tide-Lantern-47');

    await expect(verifyPassword(stored, 'Tide-Lantern-47')).resolves.toBe(true);
    await expect(verifyPassword(stored, 'tide-lantern-47')).resolves.toBe(false);
  });

  it('flags hashes made with other parameters', async () => {
    expect(isPasswordHashOutdated(await hashPassword('Tide-Lantern-47'))).toBe(false);
    expect(
      isPasswordHashOutdated('$argon2id$v=19$m=4096,t=1,p=1$c29tZXNhbHQ$aGFzaGhhc2hoYXNo'),
    ).toBe(true);
  });
});
