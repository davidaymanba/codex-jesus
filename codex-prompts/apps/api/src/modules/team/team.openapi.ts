import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

import {
  adminTeamMemberDtoSchema,
  createTeamMemberSchema,
  teamMemberDtoSchema,
  Permission,
  publicTeamQuerySchema,
  teamMemberQuerySchema,
  updateTeamMemberSchema,
} from '@codex/shared';

import { API_PREFIX } from '@/config/constants.js';
import { adminCrudPaths, adminReorderPath, publicRead } from '@/modules/docs/crud-openapi.js';
import { COMMON_ERRORS, errorResponse, successResponse } from '@/modules/docs/openapi-helpers.js';

const TAG = 'Team';

export const teamPaths: ZodOpenApiPathsObject = {
  [`${API_PREFIX}/public/team`]: {
    get: publicRead(TAG, {
      summary: 'Visible items in their arranged order',
      requestParams: { query: publicTeamQuerySchema },
      responses: {
        '200': successResponse('A page of items', z.array(teamMemberDtoSchema)),
        '400': errorResponse('Invalid query'),
        ...COMMON_ERRORS,
      },
    }),
  },
  ...adminReorderPath(TAG, '/admin/team', Permission.CONTENT_MANAGE),
  ...adminCrudPaths({
    tag: TAG,
    path: '/admin/team',
    permission: Permission.CONTENT_MANAGE,
    item: adminTeamMemberDtoSchema,
    listQuery: teamMemberQuerySchema,
    create: createTeamMemberSchema,
    update: updateTeamMemberSchema,
  }),
};
