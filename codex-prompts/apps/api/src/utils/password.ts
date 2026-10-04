import { argon2id, hash, needsRehash, verify, type HashOptions } from 'argon2';

import { PASSWORD_HASH_COST } from '@/config/constants.js';

const HASH_OPTIONS: HashOptions = {
  type: argon2id,
  memoryCost: PASSWORD_HASH_COST.MEMORY_KIB,
  timeCost: PASSWORD_HASH_COST.TIME,
  parallelism: PASSWORD_HASH_COST.PARALLELISM,
};

/** Hashes a password with argon2id; the PHC string embeds the salt and parameters. */
export function hashPassword(password: string): Promise<string> {
  return hash(password, HASH_OPTIONS);
}

/** Constant-time check of a password against a stored argon2 hash. */
export function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  return verify(passwordHash, password);
}

/** True when a stored hash uses weaker parameters than today's and should be re-hashed on login. */
export function isPasswordHashOutdated(passwordHash: string): boolean {
  return needsRehash(passwordHash, HASH_OPTIONS);
}
