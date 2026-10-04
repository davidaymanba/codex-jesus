import type { ZodOpenApiPathsObject } from 'zod-openapi';

import {
  adminTagDtoSchema,
  createTagSchema,
  Permission,
  tagQuerySchema,
  updateTagSchema,
} from '@codex/shared';

import { adminCrudPaths } from '@/modules/docs/crud-openapi.js';

export const tagPaths: ZodOpenApiPathsObject = adminCrudPaths({
  tag: 'Tags',
  path: '/admin/tags',
  permission: Permission.CONTENT_MANAGE,
  item: adminTagDtoSchema,
  listQuery: tagQuerySchema,
  create: createTagSchema,
  update: updateTagSchema,
});
