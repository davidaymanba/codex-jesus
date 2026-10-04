import { BaseRepository } from '@/lib/base-repository.js';

export class PasswordResetRepository extends BaseRepository {
  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.db.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt },
      select: { id: true },
    });
  }

  /** A newer link replaces older ones: only the latest email works. */
  async invalidateUnused(userId: string, now: Date): Promise<void> {
    await this.db.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: now },
    });
  }

  /** The unused, unexpired token with this hash, and its (active or not) user. */
  findUsable(tokenHash: string, now: Date) {
    return this.db.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
      select: {
        id: true,
        user: { select: { id: true, name: true, email: true, isActive: true } },
      },
    });
  }

  /** Marks the token used if nobody did first; false means it was just consumed. */
  async consume(id: string, now: Date): Promise<boolean> {
    const { count } = await this.db.passwordResetToken.updateMany({
      where: { id, usedAt: null },
      data: { usedAt: now },
    });
    return count === 1;
  }
}
