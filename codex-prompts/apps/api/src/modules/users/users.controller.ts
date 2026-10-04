import type { Response } from 'express';

import type { CreateUserInput, IdParams, UpdateUserInput, UserQuery } from '@codex/shared';

import type { BodyRequest, QueryRequest, ValidRequest } from '@/middleware/validate.js';
import { actorOf } from '@/modules/auth/actor.js';
import { requestPasswordReset } from '@/modules/auth/password-reset.service.js';
import { sendCreated, sendNoContent, sendSuccess } from '@/utils/response.js';

import { createUser, getUser, listUsers, updateUser } from './users.service.js';

export async function getUsers(req: QueryRequest<UserQuery>, res: Response): Promise<void> {
  const { items, meta } = await listUsers(req.query);
  sendSuccess(res, items, meta);
}

export async function getUserById(req: ValidRequest<IdParams>, res: Response): Promise<void> {
  sendSuccess(res, await getUser(req.params.id));
}

export async function postUser(req: BodyRequest<CreateUserInput>, res: Response): Promise<void> {
  sendCreated(res, await createUser(req.body, actorOf(req)));
}

export async function patchUser(
  req: ValidRequest<IdParams, UpdateUserInput>,
  res: Response,
): Promise<void> {
  sendSuccess(res, await updateUser(req.params.id, req.body, actorOf(req)));
}

export async function postPasswordResetLink(
  req: ValidRequest<IdParams>,
  res: Response,
): Promise<void> {
  await requestPasswordReset(req.params.id, actorOf(req));
  sendNoContent(res);
}
