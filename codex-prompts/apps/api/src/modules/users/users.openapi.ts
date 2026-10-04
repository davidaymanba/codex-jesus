import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

import {
  adminUserDtoSchema,
  createUserSchema,
  idParamsSchema,
  Permission,
  updateUserSchema,
  userQuerySchema,
} from '@codex/shared';

import { API_PREFIX } from '@/config/constants.js';
import { ADMIN_ERRORS, adminRead, adminWrite } from '@/modules/docs/crud-openapi.js';
import { errorResponse, jsonBody, successResponse } from '@/modules/docs/openapi-helpers.js';

const TAG = 'Users';
const MANAGE = Permission.USERS_MANAGE;
const BASE = `${API_PREFIX}/admin/users`;
const byId = { path: idParamsSchema };
const notFound = { '404': errorResponse('Not found'), ...ADMIN_ERRORS };

export const userPaths: ZodOpenApiPathsObject = {
  [BASE]: {
    get: adminRead(TAG, MANAGE, {
      summary: 'List users',
      requestParams: { query: userQuerySchema },
      responses: {
        '200': successResponse('A page of users', z.array(adminUserDtoSchema)),
        ...ADMIN_ERRORS,
      },
    }),
    post: adminWrite(TAG, MANAGE, {
      summary: 'Create a user',
      description: 'The initial password must pass the strength check.',
      requestBody: jsonBody(createUserSchema),
      responses: {
        '201': successResponse('Created', adminUserDtoSchema),
        '400': errorResponse('Invalid input or a guessable password'),
        '409': errorResponse('Email already in use'),
        ...ADMIN_ERRORS,
      },
    }),
  },
  [`${BASE}/{id}`]: {
    get: adminRead(TAG, MANAGE, {
      summary: 'Get a user',
      requestParams: byId,
      responses: { '200': successResponse('The user', adminUserDtoSchema), ...notFound },
    }),
    patch: adminWrite(TAG, MANAGE, {
      summary: 'Update name, email, role or activation',
      description:
        'Deactivating ends the user’s sessions immediately. The last active admin cannot be demoted or deactivated (409).',
      requestParams: byId,
      requestBody: jsonBody(updateUserSchema),
      responses: {
        '200': successResponse('Updated', adminUserDtoSchema),
        '400': errorResponse('Invalid input'),
        '409': errorResponse('Last active admin, or email already in use'),
        ...notFound,
      },
    }),
  },
  [`${BASE}/{id}/reset-password`]: {
    post: adminWrite(TAG, MANAGE, {
      summary: 'Email the user a password reset link',
      description: 'Single use, valid 60 minutes; earlier links stop working.',
      requestParams: byId,
      responses: { '204': { description: 'Link queued for sending' }, ...notFound },
    }),
  },
};
