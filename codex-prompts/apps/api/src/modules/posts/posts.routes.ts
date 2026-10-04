import { Router } from 'express';

import {
  createPostSchema,
  idParamsSchema,
  localeQuerySchema,
  Permission,
  postQuerySchema,
  publicPostQuerySchema,
  slugParamsSchema,
  updatePostSchema,
} from '@codex/shared';

import { validate } from '@/middleware/validate.js';
import { permitted } from '@/modules/auth/permitted.js';

import {
  getPostById,
  getPosts,
  getPublicPostBySlug,
  getPublicPosts,
  getPublicRelatedPosts,
  patchPost,
  postPost,
  removePost,
} from './posts.controller.js';

const MANAGE = Permission.CONTENT_MANAGE;
const byId = { params: idParamsSchema };
const bySlug = validate({ params: slugParamsSchema, query: localeQuerySchema });

export const postsRouter: Router = Router();

postsRouter.get('/public/posts', validate({ query: publicPostQuerySchema }), getPublicPosts);
postsRouter.get('/public/posts/:slug', bySlug, getPublicPostBySlug);
postsRouter.get('/public/posts/:slug/related', bySlug, getPublicRelatedPosts);
postsRouter.get('/admin/posts', permitted(MANAGE, { query: postQuerySchema }), getPosts);
postsRouter.post('/admin/posts', permitted(MANAGE, { body: createPostSchema }), postPost);
postsRouter.get('/admin/posts/:id', permitted(MANAGE, byId), getPostById);
postsRouter.patch(
  '/admin/posts/:id',
  permitted(MANAGE, { ...byId, body: updatePostSchema }),
  patchPost,
);
postsRouter.delete('/admin/posts/:id', permitted(MANAGE, byId), removePost);
