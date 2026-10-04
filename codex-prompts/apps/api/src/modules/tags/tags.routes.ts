import { Router } from 'express';

import {
  createTagSchema,
  idParamsSchema,
  Permission,
  tagQuerySchema,
  updateTagSchema,
} from '@codex/shared';

import { permitted } from '@/modules/auth/permitted.js';

import { getTagById, getTags, patchTag, postTag, removeTag } from './tags.controller.js';

const MANAGE = Permission.CONTENT_MANAGE;
const byId = { params: idParamsSchema };

export const tagsRouter: Router = Router();

tagsRouter.get('/admin/tags', permitted(MANAGE, { query: tagQuerySchema }), getTags);
tagsRouter.post('/admin/tags', permitted(MANAGE, { body: createTagSchema }), postTag);
tagsRouter.get('/admin/tags/:id', permitted(MANAGE, byId), getTagById);
tagsRouter.patch(
  '/admin/tags/:id',
  permitted(MANAGE, { ...byId, body: updateTagSchema }),
  patchTag,
);
tagsRouter.delete('/admin/tags/:id', permitted(MANAGE, byId), removeTag);
