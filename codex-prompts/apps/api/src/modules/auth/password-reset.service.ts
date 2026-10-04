import { randomBytes } from 'node:crypto';

import { renderPasswordReset } from '@codex/emails';
import {
  AuditAction,
  AuditEntity,
  DEFAULT_LOCALE,
  VALIDATION_MESSAGES as MSG,
  type PasswordResetConfirmInput,
} from '@codex/shared';

import { PASSWORD_RESET } from '@/config/constants.js';
import { env } from '@/config/env.js';
import { withTransaction } from '@/lib/base-repository.js';
import { emailQueue } from '@/lib/email/queue.js';
import { NotFoundError, ValidationError } from '@/lib/errors.js';
import { sha256 } from '@/lib/hash.js';
import { auditLog } from '@/modules/audit-log/audit-log.service.js';
import { UserRepository } from '@/modules/users/users.repository.js';
import { isPasswordGuessable } from '@/utils/password-strength.js';
import { hashPassword } from '@/utils/password.js';

import type { Actor } from './actor.js';
import { AuthUserRepository } from './auth-user.repository.js';
import type { ClientContext } from './auth.types.js';
import { PasswordResetRepository } from './password-reset.repository.js';

const MS_PER_MINUTE = 60_000;
const resets = new PasswordResetRepository();
const users = new UserRepository();
const INVALID_TOKEN = new ValidationError([{ path: 'token', message: MSG.INVALID_TOKEN }]);

/** The admin page that completes the reset (Phase 6); the token travels in the query. */
function resetUrl(token: string): string {
  const url = new URL('/admin/reset-password', env.ADMIN_URL ?? env.FRONTEND_URL);
  url.searchParams.set('token', token);
  return url.toString();
}

/**
 * An admin asks for a user's reset link: a single-use token (only its SHA-256 is stored),
 * valid for PASSWORD_RESET.TTL_MINUTES, emailed to the user. Earlier links stop working.
 */
export async function requestPasswordReset(userId: string, actor: Actor): Promise<void> {
  const user = await users.findById(userId);
  if (!user?.isActive) throw new NotFoundError();
  const token = randomBytes(PASSWORD_RESET.TOKEN_BYTES).toString('base64url');
  const now = new Date();
  await withTransaction(async (tx) => {
    const repository = new PasswordResetRepository(tx);
    await repository.invalidateUnused(user.id, now);
    await repository.create(
      user.id,
      sha256(token),
      new Date(now.getTime() + PASSWORD_RESET.TTL_MINUTES * MS_PER_MINUTE),
    );
    await auditLog.record(
      {
        actorId: actor.userId,
        action: AuditAction.PASSWORD_RESET_REQUESTED,
        entity: AuditEntity.USER,
        entityId: user.id,
        ip: actor.ip,
      },
      tx,
    );
  });
  emailQueue.enqueue({
    name: 'password-reset',
    build: async () => ({
      to: user.email,
      ...(await renderPasswordReset({
        locale: DEFAULT_LOCALE,
        name: user.name,
        resetUrl: resetUrl(token),
        expiresInMinutes: PASSWORD_RESET.TTL_MINUTES,
      })),
    }),
  });
}

/**
 * Completes a reset: sets the new password (credentials version changes, so old access
 * tokens die), consumes the token, lifts any lockout and ends every session. The user then
 * signs in normally.
 */
export async function confirmPasswordReset(
  { token, newPassword }: PasswordResetConfirmInput,
  client: ClientContext,
): Promise<void> {
  const now = new Date();
  const reset = await resets.findUsable(sha256(token), now);
  if (!reset?.user.isActive) throw INVALID_TOKEN;
  const { user } = reset;
  if (isPasswordGuessable(newPassword, [user.email, user.name])) {
    throw new ValidationError([{ path: 'newPassword', message: MSG.PASSWORD_WEAK }]);
  }
  const passwordHash = await hashPassword(newPassword);
  await withTransaction(async (tx) => {
    if (!(await new PasswordResetRepository(tx).consume(reset.id, now))) throw INVALID_TOKEN;
    await new AuthUserRepository(tx).resetPassword(user.id, passwordHash, now);
    await new UserRepository(tx).revokeAllSessions(user.id, now);
    await auditLog.record(
      {
        actorId: user.id,
        action: AuditAction.PASSWORD_RESET,
        entity: AuditEntity.USER,
        entityId: user.id,
        changes: { fields: ['password'], sessionsRevoked: true },
        ip: client.ip,
      },
      tx,
    );
  });
}
