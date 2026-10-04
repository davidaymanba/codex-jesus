import { Role, type UpdateUserInput, type UserQuery } from '@codex/shared';

import type { Prisma } from '@/generated/prisma/client.js';
import { BaseRepository } from '@/lib/base-repository.js';
import { escapeLike } from '@/utils/like.js';
import { withoutUndefined } from '@/utils/objects.js';
import { orderByOf } from '@/utils/sort.js';

/** Safe fields only: never the password hash or lockout counters. */
export const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.UserSelect;

export type UserRow = Prisma.UserGetPayload<{ select: typeof USER_SELECT }>;

export interface NewUser {
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  passwordHash: string;
}

export class UserRepository extends BaseRepository {
  async list(query: UserQuery, page: { skip: number; take: number }) {
    const term = query.q ? escapeLike(query.q) : undefined;
    const where: Prisma.UserWhereInput = {
      ...(query.role && { role: query.role }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(term && {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
        ],
      }),
    };
    const [rows, total] = await Promise.all([
      this.db.user.findMany({
        where,
        select: USER_SELECT,
        orderBy: orderByOf(query.sortBy, query.sortOrder),
        skip: page.skip,
        take: page.take,
      }),
      this.db.user.count({ where }),
    ]);
    return { rows, total };
  }

  findById(id: string): Promise<UserRow | null> {
    return this.db.user.findUnique({ where: { id }, select: USER_SELECT });
  }

  create(data: NewUser): Promise<UserRow> {
    return this.db.user.create({ data, select: USER_SELECT });
  }

  update(id: string, input: UpdateUserInput): Promise<UserRow> {
    return this.db.user.update({
      where: { id },
      data: withoutUndefined(input),
      select: USER_SELECT,
    });
  }

  /**
   * Ids of the active admins, row-locked until the transaction ends: two concurrent demotions
   * or deactivations serialize here, so the last admin can never be removed by a race.
   */
  async lockActiveAdminIds(): Promise<string[]> {
    const rows = await this.db.$queryRaw<{ id: string }[]>`
      SELECT id FROM users WHERE role = ${Role.ADMIN}::"Role" AND "isActive" = true FOR UPDATE`;
    return rows.map(({ id }) => id);
  }

  /** Ends every session of a user (deactivation, password reset). */
  async revokeAllSessions(userId: string, now: Date): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    });
  }
}
