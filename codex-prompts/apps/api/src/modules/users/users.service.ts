import {
  AuditAction,
  AuditEntity,
  CACHE_TAGS,
  Role,
  VALIDATION_MESSAGES as MSG,
  type AdminUserDto,
  type CreateUserInput,
  type PaginationMeta,
  type UpdateUserInput,
  type UserQuery,
} from '@codex/shared';

import { withTransaction } from '@/lib/base-repository.js';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors.js';
import type { Actor } from '@/modules/auth/actor.js';
import { auditWrite, diffOf } from '@/modules/content/audit.js';
import { publishChanges } from '@/modules/content/publish-changes.js';
import { paginate } from '@/utils/pagination.js';
import { isPasswordGuessable } from '@/utils/password-strength.js';
import { hashPassword } from '@/utils/password.js';

import { toAdminUserDto } from './users.mapper.js';
import { UserRepository } from './users.repository.js';

const users = new UserRepository();

export async function listUsers(
  query: UserQuery,
): Promise<{ items: AdminUserDto[]; meta: PaginationMeta }> {
  const page = paginate(query);
  const { rows, total } = await users.list(query, page);
  return { items: rows.map(toAdminUserDto), meta: page.toMeta(total) };
}

async function findOrFail(id: string, repository = users): Promise<AdminUserDto> {
  const row = await repository.findById(id);
  if (!row) throw new NotFoundError();
  return toAdminUserDto(row);
}

export const getUser = (id: string): Promise<AdminUserDto> => findOrFail(id);

/** Creates an admin or editor with a vetted initial password (never logged or audited). */
export async function createUser(input: CreateUserInput, actor: Actor): Promise<AdminUserDto> {
  if (isPasswordGuessable(input.password, [input.email, input.name])) {
    throw new ValidationError([{ path: 'password', message: MSG.PASSWORD_WEAK }]);
  }
  const { password, ...profile } = input;
  const passwordHash = await hashPassword(password);
  return withTransaction(async (tx) => {
    const user = toAdminUserDto(await new UserRepository(tx).create({ ...profile, passwordHash }));
    await auditWrite(tx, actor, {
      action: AuditAction.CREATE,
      entity: AuditEntity.USER,
      entityId: user.id,
      changes: profile,
    });
    return user;
  });
}

/** True when the change takes an active admin out of the active admins. */
const removesAnAdmin = (before: AdminUserDto, input: UpdateUserInput): boolean =>
  before.role === Role.ADMIN &&
  before.isActive &&
  ((input.role !== undefined && input.role !== Role.ADMIN) || input.isActive === false);

/**
 * Profile, role and activation changes. The last active admin can never be demoted or
 * deactivated (checked under a row lock); deactivation ends the user's sessions at once.
 */
export async function updateUser(
  id: string,
  input: UpdateUserInput,
  actor: Actor,
): Promise<AdminUserDto> {
  const updated = await withTransaction(async (tx) => {
    const repository = new UserRepository(tx);
    const before = await findOrFail(id, repository);
    if (removesAnAdmin(before, input)) {
      const admins = await repository.lockActiveAdminIds();
      if (admins.length <= 1 && admins.includes(id)) {
        throw new ConflictError([
          { path: input.isActive === false ? 'isActive' : 'role', message: MSG.LAST_ADMIN },
        ]);
      }
    }
    const after = toAdminUserDto(await repository.update(id, input));
    if (before.isActive && !after.isActive) await repository.revokeAllSessions(id, new Date());
    await auditWrite(tx, actor, {
      action: AuditAction.UPDATE,
      entity: AuditEntity.USER,
      entityId: id,
      changes: diffOf(before, after),
    });
    return { before, after };
  });
  // Author names appear on public posts.
  if (updated.before.name !== updated.after.name) await publishChanges([CACHE_TAGS.POSTS]);
  return updated.after;
}
