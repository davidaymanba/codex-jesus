import { randomUUID } from 'node:crypto';

import { AuditAction, AuditEntity, type AuthUser } from '@codex/shared';

import { REFRESH_REUSE_GRACE_MS, USER_AGENT_MAX_LENGTH } from '@/config/constants.js';
import { withTransaction } from '@/lib/base-repository.js';
import { RefreshConflictError, UnauthorizedError } from '@/lib/errors.js';
import { hashIp } from '@/lib/hash.js';
import { logger } from '@/lib/logger.js';
import type { DbClient } from '@/lib/prisma.js';
import { auditLog } from '@/modules/audit-log/audit-log.service.js';

import { credentialsVersionOf, signAccessToken } from './access-token.js';
import { AuthUserRepository, type SessionUser } from './auth-user.repository.js';
import type { ClientContext } from './auth.types.js';
import { assertValidCsrf, issueCsrfToken } from './csrf.js';
import { generateRefreshToken, hashRefreshToken, refreshExpiry } from './refresh-token.js';
import { RefreshTokenRepository, type StoredRefreshToken } from './refresh-token.repository.js';

/** Everything the controller turns into cookies. */
export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
  csrfToken: string;
}

export interface AuthResult {
  user: AuthUser;
  tokens: SessionTokens;
}

/** The CSRF token as sent back by the browser: cookie and header must match. */
export interface CsrfPair {
  cookie: string | undefined;
  header: string | undefined;
}

const users = new AuthUserRepository();
const refreshTokens = new RefreshTokenRepository();

/** The safe, public view of a user. */
export function toAuthUser(user: SessionUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  };
}

async function buildTokens(
  user: SessionUser,
  sessionId: string,
  refreshToken: string,
  refreshExpiresAt: Date,
): Promise<SessionTokens> {
  return {
    accessToken: await signAccessToken({
      userId: user.id,
      role: user.role,
      sessionId,
      credentialsVersion: credentialsVersionOf(user.passwordChangedAt),
    }),
    refreshToken,
    refreshExpiresAt,
    csrfToken: issueCsrfToken(sessionId),
  };
}

interface TokenSession {
  userId: string;
  familyId: string;
  sessionStartedAt: Date;
}

function newTokenRecord(
  { userId, familyId, sessionStartedAt }: TokenSession,
  expiresAt: Date,
  client: ClientContext,
) {
  const { token, tokenHash } = generateRefreshToken();
  return {
    token,
    record: {
      userId,
      familyId,
      sessionStartedAt,
      tokenHash,
      expiresAt,
      userAgent: client.userAgent?.slice(0, USER_AGENT_MAX_LENGTH) ?? null,
      ipHash: hashIp(client.ip),
    },
  };
}

/** Opens a new session (token family) for a user who just proved their identity. */
export async function startSession(
  user: SessionUser,
  client: ClientContext,
  now: Date,
  db?: DbClient,
): Promise<SessionTokens> {
  const familyId = randomUUID();
  // A brand-new session always has its full sliding lifetime ahead.
  const expiresAt = refreshExpiry(now, now) ?? now;
  const session = { userId: user.id, familyId, sessionStartedAt: now };
  const { token, record } = newTokenRecord(session, expiresAt, client);
  await new RefreshTokenRepository(db).create(record);
  return buildTokens(user, familyId, token, expiresAt);
}

/**
 * What presenting an already revoked token means. A token revoked with its whole session
 * (logout, password change, deactivation) just ends there. A *rotated* token presented within
 * the grace window is two tabs refreshing at once. Anything else means the token leaked.
 */
function classifyRevokedTokenUse(
  stored: StoredRefreshToken,
  now: Date,
): 'session-ended' | 'concurrent-refresh' | 'reuse' {
  if (stored.replacedById === null || stored.revokedAt === null) return 'session-ended';
  const revokedAgoMs = now.getTime() - stored.revokedAt.getTime();
  return revokedAgoMs < REFRESH_REUSE_GRACE_MS ? 'concurrent-refresh' : 'reuse';
}

/** A leaked token was replayed: end the whole session and record the security event. */
async function reportTokenReuse(stored: StoredRefreshToken, client: ClientContext, now: Date) {
  await refreshTokens.revokeFamily(stored.familyId, now);
  logger.warn(
    { userId: stored.userId, sessionId: stored.familyId },
    'Refresh token reuse detected; session revoked',
  );
  await auditLog.record({
    actorId: stored.userId,
    action: AuditAction.TOKEN_REUSE_DETECTED,
    entity: AuditEntity.USER,
    entityId: stored.userId,
    changes: { sessionId: stored.familyId },
    ip: client.ip,
  });
}

async function rejectRevokedToken(
  stored: StoredRefreshToken,
  client: ClientContext,
  now: Date,
): Promise<never> {
  const use = classifyRevokedTokenUse(stored, now);
  if (use === 'concurrent-refresh') throw new RefreshConflictError();
  if (use === 'reuse') await reportTokenReuse(stored, client, now);
  throw new UnauthorizedError();
}

/** Replaces the presented token with a new one in the same family, exactly once. */
async function rotate(
  stored: StoredRefreshToken,
  expiresAt: Date,
  client: ClientContext,
  now: Date,
) {
  const { token, record } = newTokenRecord(stored, expiresAt, client);
  const isRotated = await withTransaction(async (tx) => {
    const repository = new RefreshTokenRepository(tx);
    if (!(await repository.revokeIfActive(stored.id, now))) return false;
    await repository.linkReplacement(stored.id, await repository.create(record));
    return true;
  });
  // Lost the race against a concurrent refresh of the same token.
  if (!isRotated) throw new RefreshConflictError();
  return token;
}

async function endSession(familyId: string, now: Date): Promise<never> {
  await refreshTokens.revokeFamily(familyId, now);
  throw new UnauthorizedError();
}

/** Rotates the refresh token (CLAUDE.md §8) and issues a fresh access token. */
export async function refreshSession(
  rawToken: string | undefined,
  csrf: CsrfPair,
  client: ClientContext,
): Promise<AuthResult> {
  if (!rawToken) throw new UnauthorizedError();
  const now = new Date();
  const stored = await refreshTokens.findByHash(hashRefreshToken(rawToken));
  if (!stored) throw new UnauthorizedError();
  if (stored.revokedAt) return rejectRevokedToken(stored, client, now);
  assertValidCsrf(stored.familyId, csrf.cookie, csrf.header);
  if (stored.expiresAt <= now) throw new UnauthorizedError();

  const user = await users.findSessionUser(stored.userId);
  if (!user?.isActive) return endSession(stored.familyId, now);
  const expiresAt = refreshExpiry(stored.sessionStartedAt, now);
  if (!expiresAt) return endSession(stored.familyId, now);

  const token = await rotate(stored, expiresAt, client, now);
  return {
    user: toAuthUser(user),
    tokens: await buildTokens(user, stored.familyId, token, expiresAt),
  };
}

/** Ends the session the refresh token belongs to. Without a (known) token there is nothing to end. */
export async function logoutSession(
  rawToken: string | undefined,
  csrf: CsrfPair,
  client: ClientContext,
): Promise<void> {
  if (!rawToken) return;
  const stored = await refreshTokens.findByHash(hashRefreshToken(rawToken));
  if (!stored) return;
  assertValidCsrf(stored.familyId, csrf.cookie, csrf.header);

  await refreshTokens.revokeFamily(stored.familyId, new Date());
  await auditLog.record({
    actorId: stored.userId,
    action: AuditAction.LOGOUT,
    entity: AuditEntity.USER,
    entityId: stored.userId,
    ip: client.ip,
  });
}
