import { Router } from 'express';

import { changePasswordSchema, loginSchema, passwordResetConfirmSchema } from '@codex/shared';

import { RATE_LIMITS } from '@/config/constants.js';
import { createRateLimiter } from '@/lib/rate-limiter.js';
import { rateLimit } from '@/middleware/rate-limit.js';
import { validate } from '@/middleware/validate.js';

import {
  getMe,
  postChangePassword,
  postLogin,
  postLogout,
  postPasswordReset,
  postRefresh,
} from './auth.controller.js';
import { requireAuth, requireCsrf } from './auth.middleware.js';

const loginLimit = rateLimit(
  createRateLimiter({ keyPrefix: 'login-ip', ...RATE_LIMITS.LOGIN_PER_IP }),
);
const refreshLimit = rateLimit(
  createRateLimiter({ keyPrefix: 'refresh-ip', ...RATE_LIMITS.REFRESH_PER_IP }),
);

export const authRouter: Router = Router();

authRouter.post('/auth/login', loginLimit, validate({ body: loginSchema }), postLogin);
// Refresh and logout are authenticated by the refresh cookie; they check CSRF themselves
// once the token tells them which session it belongs to.
authRouter.post('/auth/refresh', refreshLimit, postRefresh);
authRouter.post('/auth/logout', postLogout);
authRouter.get('/auth/me', requireAuth, getMe);
authRouter.post(
  '/auth/change-password',
  loginLimit,
  requireAuth,
  requireCsrf,
  validate({ body: changePasswordSchema }),
  postChangePassword,
);
// Unauthenticated: the emailed token is the credential. Shares the login budget per IP.
authRouter.post(
  '/auth/password-reset',
  loginLimit,
  validate({ body: passwordResetConfirmSchema }),
  postPasswordReset,
);
