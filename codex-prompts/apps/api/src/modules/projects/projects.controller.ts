import type { Response } from 'express';

import type {
  CreateProjectInput,
  IdParams,
  LocaleQuery,
  ProjectQuery,
  PublicProjectQuery,
  ReorderInput,
  SlugParams,
  UpdateProjectInput,
} from '@codex/shared';

import type { BodyRequest, QueryRequest, ValidRequest } from '@/middleware/validate.js';
import { actorOf } from '@/modules/auth/actor.js';
import { sendCreated, sendNoContent, sendSuccess } from '@/utils/response.js';

import {
  createProject,
  deleteProject,
  getProject,
  getPublicProject,
  listProjects,
  listPublicProjects,
  reorderProjects,
  updateProject,
} from './projects.service.js';

export async function getPublicProjects(
  req: QueryRequest<PublicProjectQuery>,
  res: Response,
): Promise<void> {
  const { items, meta } = await listPublicProjects(req.query);
  sendSuccess(res, items, meta);
}

export async function getPublicProjectBySlug(
  req: ValidRequest<SlugParams, unknown, LocaleQuery>,
  res: Response,
): Promise<void> {
  sendSuccess(res, await getPublicProject(req.params.slug, req.query.locale));
}

export async function getProjects(req: QueryRequest<ProjectQuery>, res: Response): Promise<void> {
  const { items, meta } = await listProjects(req.query);
  sendSuccess(res, items, meta);
}

export async function getProjectById(req: ValidRequest<IdParams>, res: Response): Promise<void> {
  sendSuccess(res, await getProject(req.params.id));
}

export async function postProject(
  req: BodyRequest<CreateProjectInput>,
  res: Response,
): Promise<void> {
  sendCreated(res, await createProject(req.body, actorOf(req)));
}

export async function patchProject(
  req: ValidRequest<IdParams, UpdateProjectInput>,
  res: Response,
): Promise<void> {
  sendSuccess(res, await updateProject(req.params.id, req.body, actorOf(req)));
}

export async function removeProject(req: ValidRequest<IdParams>, res: Response): Promise<void> {
  await deleteProject(req.params.id, actorOf(req));
  sendNoContent(res);
}

export async function putProjectOrder(
  req: BodyRequest<ReorderInput>,
  res: Response,
): Promise<void> {
  sendSuccess(res, { updated: await reorderProjects(req.body.ids, actorOf(req)) });
}
