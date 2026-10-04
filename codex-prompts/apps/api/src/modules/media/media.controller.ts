import type { Response } from 'express';

import type { IdParams, MediaQuery, MediaUploadFields, UpdateMediaInput } from '@codex/shared';

import { ValidationError } from '@/lib/errors.js';
import type { BodyRequest, QueryRequest, ValidRequest } from '@/middleware/validate.js';
import { actorOf } from '@/modules/auth/actor.js';
import { sendCreated, sendNoContent, sendSuccess } from '@/utils/response.js';

import {
  deleteMedia,
  getMedia,
  getMediaUsage,
  listMedia,
  updateMedia,
  uploadMedia,
} from './media.service.js';

export async function getMediaList(req: QueryRequest<MediaQuery>, res: Response): Promise<void> {
  const { items, meta } = await listMedia(req.query);
  sendSuccess(res, items, meta);
}

export async function getMediaById(req: ValidRequest<IdParams>, res: Response): Promise<void> {
  sendSuccess(res, await getMedia(req.params.id));
}

export async function getMediaUsageById(req: ValidRequest<IdParams>, res: Response): Promise<void> {
  sendSuccess(res, await getMediaUsage(req.params.id));
}

export async function postMedia(req: BodyRequest<MediaUploadFields>, res: Response): Promise<void> {
  const { file } = req;
  if (!file) throw new ValidationError();
  sendCreated(res, await uploadMedia(file.buffer, req.body, actorOf(req)));
}

export async function patchMedia(
  req: ValidRequest<IdParams, UpdateMediaInput>,
  res: Response,
): Promise<void> {
  sendSuccess(res, await updateMedia(req.params.id, req.body, actorOf(req)));
}

export async function removeMedia(req: ValidRequest<IdParams>, res: Response): Promise<void> {
  await deleteMedia(req.params.id, actorOf(req));
  sendNoContent(res);
}
