import { Router } from 'express';

import {
  createUserSchema,
  idParamsSchema,
  Permission,
  updateUserSchema,
  userQuerySchema,
} from '@codex/shared';

import { permitted } from '@/modules/auth/permitted.js';

import {
  getUserById,
  getUsers,
  patchUser,
  postPasswordResetLink,
  postUser,
} from './users.controller.js';

// ADMIN only: EDITOR has no USERS_MANAGE. Users are deactivated, never deleted.
const MANAGE = Permission.USERS_MANAGE;
const byId = { params: idParamsSchema };

export const usersRouter: Router = Router();

usersRouter.get('/admin/users', permitted(MANAGE, { query: userQuerySchema }), getUsers);
usersRouter.post('/admin/users', permitted(MANAGE, { body: createUserSchema }), postUser);
usersRouter.get('/admin/users/:id', permitted(MANAGE, byId), getUserById);
usersRouter.patch(
  '/admin/users/:id',
  permitted(MANAGE, { ...byId, body: updateUserSchema }),
  patchUser,
);
usersRouter.post('/admin/users/:id/reset-password', permitted(MANAGE, byId), postPasswordResetLink);
