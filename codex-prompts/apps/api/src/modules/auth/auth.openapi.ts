import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

import {
  authUserSchema,
  changePasswordSchema,
  loginSchema,
  passwordResetConfirmSchema,
} from '@codex/shared';

import { API_PREFIX } from '@/config/constants.js';
import {
  COMMON_ERRORS,
  COOKIE_AUTH,
  COOKIE_AUTH_WITH_CSRF,
  errorResponse,
  jsonBody,
  successResponse,
} from '@/modules/docs/openapi-helpers.js';

const sessionSchema = z.object({ user: authUserSchema });
const tags = ['Auth'];
const SESSION_COOKIES =
  'Sets the httpOnly `codex_at` (access, 15 min) and `codex_rt` (refresh, path /api/v1/auth) cookies and the readable `codex_csrf` cookie.';

export const authPaths: ZodOpenApiPathsObject = {
  [`${API_PREFIX}/auth/login`]: {
    post: {
      tags,
      summary: 'Sign in',
      description: `${SESSION_COOKIES} 5 wrong passwords lock the account for 15 minutes.`,
      requestBody: jsonBody(loginSchema),
      responses: {
        '200': successResponse('Signed in', sessionSchema),
        '400': errorResponse('Invalid input'),
        '401': errorResponse('Invalid credentials (same answer for unknown accounts)'),
        '403': errorResponse('Foreign Origin'),
        ...COMMON_ERRORS,
      },
    },
  },
  [`${API_PREFIX}/auth/refresh`]: {
    post: {
      tags,
      summary: 'Rotate the refresh token',
      description: `Requires the \`codex_rt\` cookie and the X-CSRF-Token header. ${SESSION_COOKIES} Reusing a rotated token revokes the whole session.`,
      security: [{ refreshTokenCookie: [], csrfHeader: [] }],
      responses: {
        '200': successResponse('New tokens issued', sessionSchema),
        '401': errorResponse('Missing, expired, revoked or reused refresh token'),
        '409': errorResponse(
          'REFRESH_CONFLICT: another tab refreshed this session first; retry the request',
        ),
        '403': errorResponse('Missing or invalid CSRF token'),
        ...COMMON_ERRORS,
      },
    },
  },
  [`${API_PREFIX}/auth/logout`]: {
    post: {
      tags,
      summary: 'Sign out',
      description: 'Revokes the current session and clears the auth cookies.',
      security: [{ refreshTokenCookie: [], csrfHeader: [] }],
      responses: {
        '204': { description: 'Signed out' },
        '403': errorResponse('Missing or invalid CSRF token'),
        ...COMMON_ERRORS,
      },
    },
  },
  [`${API_PREFIX}/auth/me`]: {
    get: {
      tags,
      summary: 'The signed-in user',
      security: COOKIE_AUTH,
      responses: {
        '200': successResponse('Current user (safe fields only)', sessionSchema),
        '401': errorResponse('Not signed in'),
        ...COMMON_ERRORS,
      },
    },
  },
  [`${API_PREFIX}/auth/change-password`]: {
    post: {
      tags,
      summary: 'Change the password',
      description: 'Ends every other session; the current one continues with a new access cookie.',
      security: COOKIE_AUTH_WITH_CSRF,
      requestBody: jsonBody(changePasswordSchema),
      responses: {
        '204': { description: 'Password changed' },
        '400': errorResponse('New password too weak or invalid input'),
        '401': errorResponse('Not signed in or wrong current password'),
        '403': errorResponse('Missing or invalid CSRF token'),
        ...COMMON_ERRORS,
      },
    },
  },
  [`${API_PREFIX}/auth/password-reset`]: {
    post: {
      tags,
      summary: 'Complete an emailed password reset',
      description:
        'The token comes from the reset link (single use, 60 minutes). Sets the new password, lifts any lockout and ends every session; sign in afterwards.',
      requestBody: jsonBody(passwordResetConfirmSchema),
      responses: {
        '204': { description: 'Password reset' },
        '400': errorResponse('Invalid or expired token, or a guessable password'),
        ...COMMON_ERRORS,
      },
    },
  },
};
