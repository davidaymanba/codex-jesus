import type { Response } from 'express';

import type {
  CreateServiceInput,
  IdParams,
  LocaleQuery,
  Pagination,
  ReorderInput,
  ServiceQuery,
  SlugParams,
  UpdateServiceInput,
} from '@codex/shared';

import type { BodyRequest, QueryRequest, ValidRequest } from '@/middleware/validate.js';
import { actorOf } from '@/modules/auth/actor.js';
import { sendCreated, sendNoContent, sendSuccess } from '@/utils/response.js';

import {
  createService,
  deleteService,
  getPublicService,
  getService,
  listPublicServices,
  listServices,
  reorderServices,
  updateService,
} from './services.service.js';

export async function getPublicServices(
  req: QueryRequest<Pagination>,
  res: Response,
): Promise<void> {
  const { items, meta } = await listPublicServices(req.query);
  sendSuccess(res, items, meta);
}

export async function getPublicServiceBySlug(
  req: ValidRequest<SlugParams, unknown, LocaleQuery>,
  res: Response,
): Promise<void> {
  sendSuccess(res, await getPublicService(req.params.slug, req.query.locale));
}

export async function getServices(req: QueryRequest<ServiceQuery>, res: Response): Promise<void> {
  const { items, meta } = await listServices(req.query);
  sendSuccess(res, items, meta);
}

export async function getServiceById(req: ValidRequest<IdParams>, res: Response): Promise<void> {
  sendSuccess(res, await getService(req.params.id));
}

export async function postService(
  req: BodyRequest<CreateServiceInput>,
  res: Response,
): Promise<void> {
  sendCreated(res, await createService(req.body, actorOf(req)));
}

export async function patchService(
  req: ValidRequest<IdParams, UpdateServiceInput>,
  res: Response,
): Promise<void> {
  sendSuccess(res, await updateService(req.params.id, req.body, actorOf(req)));
}

export async function removeService(req: ValidRequest<IdParams>, res: Response): Promise<void> {
  await deleteService(req.params.id, actorOf(req));
  sendNoContent(res);
}

export async function putServiceOrder(
  req: BodyRequest<ReorderInput>,
  res: Response,
): Promise<void> {
  sendSuccess(res, { updated: await reorderServices(req.body.ids, actorOf(req)) });
}
