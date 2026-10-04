import { Router } from 'express';

import {
  categoryQuerySchema,
  createCategorySchema,
  idParamsSchema,
  Permission,
  publicCategoryQuerySchema,
  updateCategorySchema,
} from '@codex/shared';

import { validate } from '@/middleware/validate.js';
import { permitted } from '@/modules/auth/permitted.js';

import {
  getCategories,
  getCategoryById,
  getPublicCategories,
  patchCategory,
  postCategory,
  removeCategory,
} from './categories.controller.js';

const MANAGE = Permission.CONTENT_MANAGE;
const byId = { params: idParamsSchema };

export const categoriesRouter: Router = Router();

categoriesRouter.get(
  '/public/categories',
  validate({ query: publicCategoryQuerySchema }),
  getPublicCategories,
);
categoriesRouter.get(
  '/admin/categories',
  permitted(MANAGE, { query: categoryQuerySchema }),
  getCategories,
);
categoriesRouter.post(
  '/admin/categories',
  permitted(MANAGE, { body: createCategorySchema }),
  postCategory,
);
categoriesRouter.get('/admin/categories/:id', permitted(MANAGE, byId), getCategoryById);
categoriesRouter.patch(
  '/admin/categories/:id',
  permitted(MANAGE, { ...byId, body: updateCategorySchema }),
  patchCategory,
);
categoriesRouter.delete('/admin/categories/:id', permitted(MANAGE, byId), removeCategory);
