import { Router } from 'express';

import {
  createProjectSchema,
  idParamsSchema,
  localeQuerySchema,
  Permission,
  projectQuerySchema,
  publicProjectQuerySchema,
  reorderSchema,
  slugParamsSchema,
  updateProjectSchema,
} from '@codex/shared';

import { validate } from '@/middleware/validate.js';
import { permitted } from '@/modules/auth/permitted.js';

import {
  getProjectById,
  getProjects,
  getPublicProjectBySlug,
  getPublicProjects,
  patchProject,
  postProject,
  putProjectOrder,
  removeProject,
} from './projects.controller.js';

const MANAGE = Permission.CONTENT_MANAGE;
const byId = { params: idParamsSchema };

export const projectsRouter: Router = Router();

projectsRouter.get(
  '/public/projects',
  validate({ query: publicProjectQuerySchema }),
  getPublicProjects,
);
projectsRouter.get(
  '/public/projects/:slug',
  validate({ params: slugParamsSchema, query: localeQuerySchema }),
  getPublicProjectBySlug,
);
projectsRouter.get(
  '/admin/projects',
  permitted(MANAGE, { query: projectQuerySchema }),
  getProjects,
);
projectsRouter.post(
  '/admin/projects',
  permitted(MANAGE, { body: createProjectSchema }),
  postProject,
);
projectsRouter.put(
  '/admin/projects/reorder',
  permitted(MANAGE, { body: reorderSchema }),
  putProjectOrder,
);
projectsRouter.get('/admin/projects/:id', permitted(MANAGE, byId), getProjectById);
projectsRouter.patch(
  '/admin/projects/:id',
  permitted(MANAGE, { ...byId, body: updateProjectSchema }),
  patchProject,
);
projectsRouter.delete('/admin/projects/:id', permitted(MANAGE, byId), removeProject);
