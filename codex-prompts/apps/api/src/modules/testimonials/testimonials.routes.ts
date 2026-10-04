import { Router } from 'express';

import {
  createTestimonialSchema,
  idParamsSchema,
  Permission,
  paginationSchema,
  reorderSchema,
  testimonialQuerySchema,
  updateTestimonialSchema,
} from '@codex/shared';

import { validate } from '@/middleware/validate.js';
import { permitted } from '@/modules/auth/permitted.js';

import {
  getTestimonialById,
  getTestimonials,
  getPublicTestimonials,
  patchTestimonial,
  postTestimonial,
  putTestimonialOrder,
  removeTestimonial,
} from './testimonials.controller.js';

const MANAGE = Permission.CONTENT_MANAGE;
const byId = { params: idParamsSchema };

export const testimonialsRouter: Router = Router();

testimonialsRouter.get(
  '/public/testimonials',
  validate({ query: paginationSchema }),
  getPublicTestimonials,
);
testimonialsRouter.get(
  '/admin/testimonials',
  permitted(MANAGE, { query: testimonialQuerySchema }),
  getTestimonials,
);
testimonialsRouter.post(
  '/admin/testimonials',
  permitted(MANAGE, { body: createTestimonialSchema }),
  postTestimonial,
);
testimonialsRouter.put(
  '/admin/testimonials/reorder',
  permitted(MANAGE, { body: reorderSchema }),
  putTestimonialOrder,
);
testimonialsRouter.get('/admin/testimonials/:id', permitted(MANAGE, byId), getTestimonialById);
testimonialsRouter.patch(
  '/admin/testimonials/:id',
  permitted(MANAGE, { ...byId, body: updateTestimonialSchema }),
  patchTestimonial,
);
testimonialsRouter.delete('/admin/testimonials/:id', permitted(MANAGE, byId), removeTestimonial);
