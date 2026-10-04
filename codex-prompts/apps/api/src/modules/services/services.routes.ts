import { Router } from 'express';

import {
  createServiceSchema,
  idParamsSchema,
  localeQuerySchema,
  paginationSchema,
  Permission,
  reorderSchema,
  serviceQuerySchema,
  slugParamsSchema,
  updateServiceSchema,
} from '@codex/shared';

import { validate } from '@/middleware/validate.js';
import { permitted } from '@/modules/auth/permitted.js';

import {
  getPublicServiceBySlug,
  getPublicServices,
  getServiceById,
  getServices,
  patchService,
  postService,
  putServiceOrder,
  removeService,
} from './services.controller.js';

const MANAGE = Permission.CONTENT_MANAGE;
const byId = { params: idParamsSchema };

export const servicesRouter: Router = Router();

servicesRouter.get('/public/services', validate({ query: paginationSchema }), getPublicServices);
servicesRouter.get(
  '/public/services/:slug',
  validate({ params: slugParamsSchema, query: localeQuerySchema }),
  getPublicServiceBySlug,
);
servicesRouter.get(
  '/admin/services',
  permitted(MANAGE, { query: serviceQuerySchema }),
  getServices,
);
servicesRouter.post(
  '/admin/services',
  permitted(MANAGE, { body: createServiceSchema }),
  postService,
);
// Before `/:id`, so "reorder" is never read as an id.
servicesRouter.put(
  '/admin/services/reorder',
  permitted(MANAGE, { body: reorderSchema }),
  putServiceOrder,
);
servicesRouter.get('/admin/services/:id', permitted(MANAGE, byId), getServiceById);
servicesRouter.patch(
  '/admin/services/:id',
  permitted(MANAGE, { ...byId, body: updateServiceSchema }),
  patchService,
);
servicesRouter.delete('/admin/services/:id', permitted(MANAGE, byId), removeService);
