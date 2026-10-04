import { randomBytes } from 'node:crypto';

import { RateLimiterRes } from 'rate-limiter-flexible';

import {
  AuditAction,
  AuditEntity,
  isPasswordRelatedToEmail,
  VALIDATION_MESSAGES as MSG,
  type ChangePasswordInput,
  type LoginInput,
} from '@codex/shared';

import { LOGIN_LOCKOUT, RATE_LIMITS } from '@/config/constants.js';
import { withTransaction } from '@/lib/base-repository.js';
import { RateLimitError, UnauthorizedError, ValidationError } from '@/lib/errors.js';
import { hashIdentifier } from '@/lib/hash.js';
import { createRateLimiter } from '@/lib/rate-limiter.js';
import { auditLog } from '@/modules/audit-log/audit-log.service.js';
import { isPasswordGuessable } from '@/utils/password-strength.js';
import { hashPassword, isPasswordHashOutdated, verifyPassword } from '@/utils/password.js';

import { credentialsVersionOf, signAccessToken } from './access-token.js';
import { AuthUserRepository, type UserCredentials } from './auth-user.repository.js';
import type { AuthContext, ClientContext } from './auth.types.js';
import { RefreshTokenRepository } from './refresh-token.repository.js';
import { startSession, toAuthUser, type AuthResult } from './session.service.js';

const MS_PER_SECOND = 1000;
const users = new AuthUserRepository();
/** Failed logins per email, existing or not, so throttling never reveals which accounts exist. */
const emailFailures = createRateLimiter({
  keyPrefix: 'login-email',
  ...RATE_LIMITS.LOGIN_PER_EMAIL,
});

let dummyHash: Promise<string> | undefined;
/** A real argon2id hash to verify against when the user does not exist (same timing). */
function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(32).toString('hex'));
  return dummyHash;
}

const secondsUntil = (date: Date, now: Date): number =>
  Math.max(1, Math.ceil((date.getTime() - now.getTime()) / MS_PER_SECOND));

async function assertEmailNotThrottled(emailKey: string): Promise<void> {
  const state = await emailFailures.get(emailKey);
  if (state && state.remainingPoints <= 0) {
    throw new RateLimitError(Math.ceil(state.msBeforeNext / MS_PER_SECOND));
  }
}

async function recordEmailFailure(emailKey: string): Promise<void> {
  // Running out of points is expected here; the next attempt is the one that gets 429.
  await emailFailures.consume(emailKey).catch((rejection: unknown) => {
    if (!(rejection instanceof RateLimiterRes)) throw rejection;
  });
}

/**
 * Counts a wrong password against the account; the 5th in a row locks it for 15 minutes.
 * The lock and its audit entry commit together.
 */
async function registerWrongPassword(user: UserCredentials, client: ClientContext, now: Date) {
  await withTransaction(async (tx) => {
    const repository = new AuthUserRepository(tx);
    const attempts = await repository.incrementFailedAttempts(user.id);
    if (attempts < LOGIN_LOCKOUT.MAX_FAILED_ATTEMPTS) return;
    await repository.lock(user.id, new Date(now.getTime() + LOGIN_LOCKOUT.DURATION_MS));
    await auditLog.record(
      {
        actorId: user.id,
        action: AuditAction.ACCOUNT_LOCKED,
        entity: AuditEntity.USER,
        entityId: user.id,
        ip: client.ip,
      },
      tx,
    );
  });
}

/** A locked account answers like throttling (429), wherever its password is checked. */
function assertNotLocked(user: UserCredentials, now: Date): void {
  if (user.lockedUntil && user.lockedUntil > now) {
    throw new RateLimitError(secondsUntil(user.lockedUntil, now));
  }
}

/** One generic answer for every failure: unknown email, wrong password, inactive account. */
async function failLogin(
  emailKey: string,
  client: ClientContext,
  userId: string | null,
  reason: string,
): Promise<never> {
  await recordEmailFailure(emailKey);
  await auditLog.record({
    actorId: userId,
    action: AuditAction.LOGIN_FAILED,
    entity: AuditEntity.USER,
    entityId: userId,
    changes: { reason },
    ip: client.ip,
  });
  throw new UnauthorizedError('INVALID_CREDENTIALS');
}

/**
 * Verifies credentials and opens a session. Unknown emails and locked accounts still run an
 * argon2 verification, so response times do not reveal which accounts exist.
 */
export async function login(
  { email, password }: LoginInput,
  client: ClientContext,
): Promise<AuthResult> {
  const emailKey = hashIdentifier(email);
  await assertEmailNotThrottled(emailKey);
  const now = new Date();
  const user = await users.findCredentialsByEmail(email);

  if (!user) {
    await verifyPassword(await getDummyHash(), password);
    return failLogin(emailKey, client, null, 'unknown_account');
  }
  if (user.lockedUntil && user.lockedUntil > now) {
    await verifyPassword(await getDummyHash(), password);
    // Same 429 as the per-email throttle: a lock is indistinguishable from throttling.
    assertNotLocked(user, now);
  }
  if (!(await verifyPassword(user.passwordHash, password))) {
    await registerWrongPassword(user, client, now);
    return failLogin(emailKey, client, user.id, 'wrong_password');
  }
  if (!user.isActive) return failLogin(emailKey, client, user.id, 'inactive_account');

  return completeLogin(user, password, emailKey, client, now);
}

async function completeLogin(
  user: UserCredentials,
  password: string,
  emailKey: string,
  client: ClientContext,
  now: Date,
): Promise<AuthResult> {
  // Parameters got stronger since this hash was made: upgrade it while the password is known.
  const rehashed = isPasswordHashOutdated(user.passwordHash)
    ? await hashPassword(password)
    : undefined;
  const result = await withTransaction(async (tx) => {
    const updated = await new AuthUserRepository(tx).recordSuccessfulLogin(user.id, now, rehashed);
    await new RefreshTokenRepository(tx).deleteExpiredForUser(user.id, now);
    const tokens = await startSession(updated, client, now, tx);
    await auditLog.record(
      {
        actorId: user.id,
        action: AuditAction.LOGIN,
        entity: AuditEntity.USER,
        entityId: user.id,
        ip: client.ip,
      },
      tx,
    );
    return { user: toAuthUser(updated), tokens };
  });
  await emailFailures.delete(emailKey);
  return result;
}

function assertAcceptableNewPassword(password: string, user: UserCredentials): void {
  const message = isPasswordRelatedToEmail(password, user.email)
    ? MSG.PASSWORD_CONTAINS_EMAIL
    : isPasswordGuessable(password, [user.email, user.name])
      ? MSG.PASSWORD_WEAK
      : undefined;
  if (message) throw new ValidationError([{ path: 'newPassword', message }]);
}

/**
 * Changes the password after re-checking the current one (a wrong one counts toward the
 * lockout), then ends every other session. The caller's session continues with the returned
 * access token (tokens carrying the old credentials version are rejected by `requireAuth`).
 */
export async function changePassword(
  auth: AuthContext,
  { currentPassword, newPassword }: ChangePasswordInput,
  client: ClientContext,
): Promise<string> {
  const now = new Date();
  const user = await users.findCredentialsById(auth.userId);
  if (!user) throw new UnauthorizedError();
  // Otherwise a stolen session could keep guessing the current password during a lock.
  assertNotLocked(user, now);
  if (!(await verifyPassword(user.passwordHash, currentPassword))) {
    await registerWrongPassword(user, client, now);
    throw new UnauthorizedError('INVALID_CREDENTIALS');
  }
  assertAcceptableNewPassword(newPassword, user);

  const passwordHash = await hashPassword(newPassword);
  await withTransaction(async (tx) => {
    await new AuthUserRepository(tx).updatePassword(user.id, passwordHash, now);
    await new RefreshTokenRepository(tx).revokeOtherFamilies(user.id, auth.sessionId, now);
    await auditLog.record(
      {
        actorId: user.id,
        action: AuditAction.UPDATE,
        entity: AuditEntity.USER,
        entityId: user.id,
        changes: { fields: ['password'], otherSessionsRevoked: true },
        ip: client.ip,
      },
      tx,
    );
  });
  return signAccessToken({
    userId: user.id,
    role: user.role,
    sessionId: auth.sessionId,
    credentialsVersion: credentialsVersionOf(now),
  });
}
