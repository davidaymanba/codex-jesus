import type { Response } from 'express';

import type {
  CreateTeamMemberInput,
  IdParams,
  PublicTeamQuery,
  ReorderInput,
  TeamMemberQuery,
  UpdateTeamMemberInput,
} from '@codex/shared';

import type { BodyRequest, QueryRequest, ValidRequest } from '@/middleware/validate.js';
import { actorOf } from '@/modules/auth/actor.js';
import { sendCreated, sendNoContent, sendSuccess } from '@/utils/response.js';

import {
  createTeamMember,
  deleteTeamMember,
  getTeamMember,
  listTeamMembers,
  listPublicTeamMembers,
  reorderTeamMembers,
  updateTeamMember,
} from './team.service.js';

export async function getPublicTeamMembers(
  req: QueryRequest<PublicTeamQuery>,
  res: Response,
): Promise<void> {
  const { items, meta } = await listPublicTeamMembers(req.query);
  sendSuccess(res, items, meta);
}

export async function getTeamMembers(
  req: QueryRequest<TeamMemberQuery>,
  res: Response,
): Promise<void> {
  const { items, meta } = await listTeamMembers(req.query);
  sendSuccess(res, items, meta);
}

export async function getTeamMemberById(req: ValidRequest<IdParams>, res: Response): Promise<void> {
  sendSuccess(res, await getTeamMember(req.params.id));
}

export async function postTeamMember(
  req: BodyRequest<CreateTeamMemberInput>,
  res: Response,
): Promise<void> {
  sendCreated(res, await createTeamMember(req.body, actorOf(req)));
}

export async function patchTeamMember(
  req: ValidRequest<IdParams, UpdateTeamMemberInput>,
  res: Response,
): Promise<void> {
  sendSuccess(res, await updateTeamMember(req.params.id, req.body, actorOf(req)));
}

export async function removeTeamMember(req: ValidRequest<IdParams>, res: Response): Promise<void> {
  await deleteTeamMember(req.params.id, actorOf(req));
  sendNoContent(res);
}

export async function putTeamMemberOrder(
  req: BodyRequest<ReorderInput>,
  res: Response,
): Promise<void> {
  sendSuccess(res, { updated: await reorderTeamMembers(req.body.ids, actorOf(req)) });
}
