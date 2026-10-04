import type { Response } from 'express';

import type {
  CategoryQuery,
  CreateCategoryInput,
  IdParams,
  PublicCategoryQuery,
  UpdateCategoryInput,
} from '@codex/shared';

import type { BodyRequest, QueryRequest, ValidRequest } from '@/middleware/validate.js';
import { actorOf } from '@/modules/auth/actor.js';
import { sendCreated, sendNoContent, sendSuccess } from '@/utils/response.js';

import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  listPublicCategories,
  updateCategory,
} from './categories.service.js';

type IdRequest<TBody = unknown> = ValidRequest<IdParams, TBody>;

export async function getPublicCategories(
  req: QueryRequest<PublicCategoryQuery>,
  res: Response,
): Promise<void> {
  sendSuccess(res, await listPublicCategories(req.query.type));
}

export async function getCategories(
  req: QueryRequest<CategoryQuery>,
  res: Response,
): Promise<void> {
  const { items, meta } = await listCategories(req.query);
  sendSuccess(res, items, meta);
}

export async function getCategoryById(req: IdRequest, res: Response): Promise<void> {
  sendSuccess(res, await getCategory(req.params.id));
}

export async function postCategory(
  req: BodyRequest<CreateCategoryInput>,
  res: Response,
): Promise<void> {
  sendCreated(res, await createCategory(req.body, actorOf(req)));
}

export async function patchCategory(
  req: IdRequest<UpdateCategoryInput>,
  res: Response,
): Promise<void> {
  sendSuccess(res, await updateCategory(req.params.id, req.body, actorOf(req)));
}

export async function removeCategory(req: IdRequest, res: Response): Promise<void> {
  await deleteCategory(req.params.id, actorOf(req));
  sendNoContent(res);
}
