import type { Response } from 'express';

import type {
  CreateTestimonialInput,
  IdParams,
  Pagination,
  ReorderInput,
  TestimonialQuery,
  UpdateTestimonialInput,
} from '@codex/shared';

import type { BodyRequest, QueryRequest, ValidRequest } from '@/middleware/validate.js';
import { actorOf } from '@/modules/auth/actor.js';
import { sendCreated, sendNoContent, sendSuccess } from '@/utils/response.js';

import {
  createTestimonial,
  deleteTestimonial,
  getTestimonial,
  listTestimonials,
  listPublicTestimonials,
  reorderTestimonials,
  updateTestimonial,
} from './testimonials.service.js';

export async function getPublicTestimonials(
  req: QueryRequest<Pagination>,
  res: Response,
): Promise<void> {
  const { items, meta } = await listPublicTestimonials(req.query);
  sendSuccess(res, items, meta);
}

export async function getTestimonials(
  req: QueryRequest<TestimonialQuery>,
  res: Response,
): Promise<void> {
  const { items, meta } = await listTestimonials(req.query);
  sendSuccess(res, items, meta);
}

export async function getTestimonialById(
  req: ValidRequest<IdParams>,
  res: Response,
): Promise<void> {
  sendSuccess(res, await getTestimonial(req.params.id));
}

export async function postTestimonial(
  req: BodyRequest<CreateTestimonialInput>,
  res: Response,
): Promise<void> {
  sendCreated(res, await createTestimonial(req.body, actorOf(req)));
}

export async function patchTestimonial(
  req: ValidRequest<IdParams, UpdateTestimonialInput>,
  res: Response,
): Promise<void> {
  sendSuccess(res, await updateTestimonial(req.params.id, req.body, actorOf(req)));
}

export async function removeTestimonial(req: ValidRequest<IdParams>, res: Response): Promise<void> {
  await deleteTestimonial(req.params.id, actorOf(req));
  sendNoContent(res);
}

export async function putTestimonialOrder(
  req: BodyRequest<ReorderInput>,
  res: Response,
): Promise<void> {
  sendSuccess(res, { updated: await reorderTestimonials(req.body.ids, actorOf(req)) });
}
