import type { Response } from 'express';

import type { CreateTagInput, IdParams, TagQuery, UpdateTagInput } from '@codex/shared';

import type { BodyRequest, QueryRequest, ValidRequest } from '@/middleware/validate.js';
import { actorOf } from '@/modules/auth/actor.js';
import { sendCreated, sendNoContent, sendSuccess } from '@/utils/response.js';

import { createTag, deleteTag, getTag, listTags, updateTag } from './tags.service.js';

export async function getTags(req: QueryRequest<TagQuery>, res: Response): Promise<void> {
  const { items, meta } = await listTags(req.query);
  sendSuccess(res, items, meta);
}

export async function getTagById(req: ValidRequest<IdParams>, res: Response): Promise<void> {
  sendSuccess(res, await getTag(req.params.id));
}

export async function postTag(req: BodyRequest<CreateTagInput>, res: Response): Promise<void> {
  sendCreated(res, await createTag(req.body, actorOf(req)));
}

export async function patchTag(
  req: ValidRequest<IdParams, UpdateTagInput>,
  res: Response,
): Promise<void> {
  sendSuccess(res, await updateTag(req.params.id, req.body, actorOf(req)));
}

export async function removeTag(req: ValidRequest<IdParams>, res: Response): Promise<void> {
  await deleteTag(req.params.id, actorOf(req));
  sendNoContent(res);
}
