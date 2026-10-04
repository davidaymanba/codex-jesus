import type { AdminUserDto } from '@codex/shared';

import type { UserRow } from './users.repository.js';

export function toAdminUserDto(row: UserRow): AdminUserDto {
  return {
    ...row,
    lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
