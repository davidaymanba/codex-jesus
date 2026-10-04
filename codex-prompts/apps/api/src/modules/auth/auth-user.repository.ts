import type { Role } from '@codex/shared';

import type { Prisma } from '@/generated/prisma/client.js';
import { BaseRepository } from '@/lib/base-repository.js';

const SESSION_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  passwordChangedAt: true,
} as const satisfies Prisma.UserSelect;

const CREDENTIALS_SELECT = {
  ...SESSION_USER_SELECT,
  passwordHash: true,
  failedLoginAttempts: true,
  lockedUntil: true,
} as const satisfies Prisma.UserSelect;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: Date | null;
  passwordChangedAt: Date | null;
}

export interface UserCredentials extends SessionUser {
  passwordHash: string;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
}

/** User queries the auth flows need; user management itself lives in the users module (Phase 3). */
export class AuthUserRepository extends BaseRepository {
  findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    return this.db.user.findUnique({ where: { email }, select: CREDENTIALS_SELECT });
  }

  findCredentialsById(id: string): Promise<UserCredentials | null> {
    return this.db.user.findUnique({ where: { id }, select: CREDENTIALS_SELECT });
  }

  findSessionUser(id: string): Promise<SessionUser | null> {
    return this.db.user.findUnique({ where: { id }, select: SESSION_USER_SELECT });
  }

  /**
   * The user behind an access token, only while its session (token family) still holds an
   * unrevoked, unexpired refresh token: logout, reuse detection and deactivation end access
   * immediately instead of when the access token expires.
   */
  async findActiveSessionUser(
    id: string,
    sessionId: string,
    now: Date,
  ): Promise<SessionUser | null> {
    const user = await this.db.user.findUnique({
      where: { id },
      select: {
        ...SESSION_USER_SELECT,
        refreshTokens: {
          where: { familyId: sessionId, revokedAt: null, expiresAt: { gt: now } },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!user || user.refreshTokens.length === 0) return null;
    const { refreshTokens: _activeTokens, ...sessionUser } = user;
    return sessionUser;
  }

  /** Atomically counts one more failed attempt; returns the new count. */
  async incrementFailedAttempts(id: string): Promise<number> {
    const { failedLoginAttempts } = await this.db.user.update({
      where: { id },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true },
    });
    return failedLoginAttempts;
  }

  async lock(id: string, until: Date): Promise<void> {
    await this.db.user.update({
      where: { id },
      data: { lockedUntil: until, failedLoginAttempts: 0 },
      select: { id: true },
    });
  }

  /** Clears the failure counter and lock; optionally stores a re-hashed password. */
  recordSuccessfulLogin(id: string, now: Date, passwordHash?: string): Promise<SessionUser> {
    return this.db.user.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: now,
        ...(passwordHash && { passwordHash }),
      },
      select: SESSION_USER_SELECT,
    });
  }

  /** A new password after an emailed reset: also lifts any lockout. */
  async resetPassword(id: string, passwordHash: string, changedAt: Date): Promise<void> {
    await this.db.user.update({
      where: { id },
      data: {
        passwordHash,
        passwordChangedAt: changedAt,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      select: { id: true },
    });
  }

  async updatePassword(id: string, passwordHash: string, changedAt: Date): Promise<void> {
    await this.db.user.update({
      where: { id },
      data: { passwordHash, passwordChangedAt: changedAt },
      select: { id: true },
    });
  }
}
