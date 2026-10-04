import type { Response } from 'express';

import type {
  CreatePostInput,
  IdParams,
  LocaleQuery,
  PostQuery,
  PublicPostQuery,
  SlugParams,
  UpdatePostInput,
} from '@codex/shared';

import type { BodyRequest, QueryRequest, ValidRequest } from '@/middleware/validate.js';
import { actorOf } from '@/modules/auth/actor.js';
import { sendCreated, sendNoContent, sendSuccess } from '@/utils/response.js';

import { getPublicPost, getRelatedPosts, listPublicPosts } from './posts-public.service.js';
import { createPost, deletePost, getPost, listPosts, updatePost } from './posts.service.js';

type SlugRequest = ValidRequest<SlugParams, unknown, LocaleQuery>;

export async function getPublicPosts(
  req: QueryRequest<PublicPostQuery>,
  res: Response,
): Promise<void> {
  const { items, meta } = await listPublicPosts(req.query);
  sendSuccess(res, items, meta);
}

export async function getPublicPostBySlug(req: SlugRequest, res: Response): Promise<void> {
  sendSuccess(res, await getPublicPost(req.params.slug, req.query.locale));
}

export async function getPublicRelatedPosts(req: SlugRequest, res: Response): Promise<void> {
  sendSuccess(res, await getRelatedPosts(req.params.slug, req.query.locale));
}

export async function getPosts(req: QueryRequest<PostQuery>, res: Response): Promise<void> {
  const { items, meta } = await listPosts(req.query);
  sendSuccess(res, items, meta);
}

export async function getPostById(req: ValidRequest<IdParams>, res: Response): Promise<void> {
  sendSuccess(res, await getPost(req.params.id));
}

export async function postPost(req: BodyRequest<CreatePostInput>, res: Response): Promise<void> {
  sendCreated(res, await createPost(req.body, actorOf(req)));
}

export async function patchPost(
  req: ValidRequest<IdParams, UpdatePostInput>,
  res: Response,
): Promise<void> {
  sendSuccess(res, await updatePost(req.params.id, req.body, actorOf(req)));
}

export async function removePost(req: ValidRequest<IdParams>, res: Response): Promise<void> {
  await deletePost(req.params.id, actorOf(req));
  sendNoContent(res);
}
