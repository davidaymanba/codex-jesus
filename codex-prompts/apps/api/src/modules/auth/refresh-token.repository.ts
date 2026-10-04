import type { Prisma } from '@/generated/prisma/client.js';
import { BaseRepository } from '@/lib/base-repository.js';

export interface StoredRefreshToken {
  id: string;
  userId: string;
  familyId: string;
  sessionStartedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedById: string | null;
}

export interface NewRefreshToken {
  userId: string;
  tokenHash: string;
  familyId: string;
  sessionStartedAt: Date;
  expiresAt: Date;
  userAgent: string | null;
  ipHash: string;
}

const TOKEN_SELECT = {
  id: true,
  userId: true,
  familyId: true,
  sessionStartedAt: true,
  expiresAt: true,
  revokedAt: true,
  replacedById: true,
} as const satisfies Prisma.RefreshTokenSelect;

export class RefreshTokenRepository extends BaseRepository {
  findByHash(tokenHash: string): Promise<StoredRefreshToken | null> {
    return this.db.refreshToken.findUnique({ where: { tokenHash }, select: TOKEN_SELECT });
  }

  async create(data: NewRefreshToken): Promise<string> {
    const { id } = await this.db.refreshToken.create({ data, select: { id: true } });
    return id;
  }

  /**
   * Revokes the token only if it is still active. Returns false when another request revoked
   * it first, which makes concurrent rotations of one token impossible.
   */
  async revokeIfActive(id: string, now: Date): Promise<boolean> {
    const { count } = await this.db.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: now },
    });
    return count === 1;
  }

  async linkReplacement(id: string, replacedById: string): Promise<void> {
    await this.db.refreshToken.update({
      where: { id },
      data: { replacedById },
      select: { id: true },
    });
  }

  async revokeFamily(familyId: string, now: Date): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: now },
    });
  }

  /** Ends every session of the user except `keepFamilyId` (e.g. after a password change). */
  async revokeOtherFamilies(userId: string, keepFamilyId: string, now: Date): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: { userId, familyId: { not: keepFamilyId }, revokedAt: null },
      data: { revokedAt: now },
    });
  }

  /** Housekeeping on login: expired tokens have no further use. */
  async deleteExpiredForUser(userId: string, now: Date): Promise<void> {
    await this.db.refreshToken.deleteMany({ where: { userId, expiresAt: { lt: now } } });
  }
}
