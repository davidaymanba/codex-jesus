import { Router } from 'express';

import {
  createTeamMemberSchema,
  idParamsSchema,
  Permission,
  publicTeamQuerySchema,
  reorderSchema,
  teamMemberQuerySchema,
  updateTeamMemberSchema,
} from '@codex/shared';

import { validate } from '@/middleware/validate.js';
import { permitted } from '@/modules/auth/permitted.js';

import {
  getTeamMemberById,
  getTeamMembers,
  getPublicTeamMembers,
  patchTeamMember,
  postTeamMember,
  putTeamMemberOrder,
  removeTeamMember,
} from './team.controller.js';

const MANAGE = Permission.CONTENT_MANAGE;
const byId = { params: idParamsSchema };

export const teamRouter: Router = Router();

teamRouter.get('/public/team', validate({ query: publicTeamQuerySchema }), getPublicTeamMembers);
teamRouter.get('/admin/team', permitted(MANAGE, { query: teamMemberQuerySchema }), getTeamMembers);
teamRouter.post('/admin/team', permitted(MANAGE, { body: createTeamMemberSchema }), postTeamMember);
teamRouter.put(
  '/admin/team/reorder',
  permitted(MANAGE, { body: reorderSchema }),
  putTeamMemberOrder,
);
teamRouter.get('/admin/team/:id', permitted(MANAGE, byId), getTeamMemberById);
teamRouter.patch(
  '/admin/team/:id',
  permitted(MANAGE, { ...byId, body: updateTeamMemberSchema }),
  patchTeamMember,
);
teamRouter.delete('/admin/team/:id', permitted(MANAGE, byId), removeTeamMember);
