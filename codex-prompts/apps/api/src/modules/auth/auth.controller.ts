import type { Request, Response } from 'express';

import type { ChangePasswordInput, LoginInput, PasswordResetConfirmInput } from '@codex/shared';

import { UnauthorizedError } from '@/lib/errors.js';
import type { BodyRequest } from '@/middleware/validate.js';
import { sendNoContent, sendSuccess } from '@/utils/response.js';

import { AuthUserRepository } from './auth-user.repository.js';
import { clearSessionCookies, setAccessCookie, setSessionCookies } from './auth.cookies.js';
import { getAuth, readCsrfPair, readRefreshToken } from './auth.middleware.js';
import type { ClientContext } from './auth.types.js';
import { changePassword, login } from './credentials.service.js';
import { confirmPasswordReset } from './password-reset.service.js';
import { logoutSession, refreshSession, toAuthUser } from './session.service.js';

const users = new AuthUserRepository();

const clientOf = (req: Request): ClientContext => ({
  ip: req.ip,
  userAgent: req.get('user-agent'),
});

export async function postLogin(req: BodyRequest<LoginInput>, res: Response): Promise<void> {
  const { user, tokens } = await login(req.body, clientOf(req));
  setSessionCookies(res, tokens);
  sendSuccess(res, { user });
}

export async function postRefresh(req: Request, res: Response): Promise<void> {
  try {
    const { user, tokens } = await refreshSession(
      readRefreshToken(req),
      readCsrfPair(req),
      clientOf(req),
    );
    setSessionCookies(res, tokens);
    sendSuccess(res, { user });
  } catch (error) {
    // A dead session must not leave stale cookies behind for the next attempt.
    if (error instanceof UnauthorizedError) clearSessionCookies(res);
    throw error;
  }
}

export async function postLogout(req: Request, res: Response): Promise<void> {
  await logoutSession(readRefreshToken(req), readCsrfPair(req), clientOf(req));
  clearSessionCookies(res);
  sendNoContent(res);
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await users.findSessionUser(getAuth(req).userId);
  if (!user) throw new UnauthorizedError();
  sendSuccess(res, { user: toAuthUser(user) });
}

export async function postChangePassword(
  req: BodyRequest<ChangePasswordInput>,
  res: Response,
): Promise<void> {
  const accessToken = await changePassword(getAuth(req), req.body, clientOf(req));
  setAccessCookie(res, accessToken);
  sendNoContent(res);
}

export async function postPasswordReset(
  req: BodyRequest<PasswordResetConfirmInput>,
  res: Response,
): Promise<void> {
  await confirmPasswordReset(req.body, clientOf(req));
  sendNoContent(res);
}
