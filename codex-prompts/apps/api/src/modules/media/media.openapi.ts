import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

import {
  adminMediaDtoSchema,
  idParamsSchema,
  MEDIA_LIMITS,
  mediaQuerySchema,
  mediaUploadFieldsSchema,
  mediaUsageDtoSchema,
  Permission,
  updateMediaSchema,
} from '@codex/shared';

import { API_PREFIX } from '@/config/constants.js';
import { ADMIN_ERRORS, adminRead, adminWrite } from '@/modules/docs/crud-openapi.js';
import { errorResponse, jsonBody, successResponse } from '@/modules/docs/openapi-helpers.js';

const TAG = 'Media';
const MANAGE = Permission.MEDIA_MANAGE;
const BASE = `${API_PREFIX}/admin/media`;
const byId = { path: idParamsSchema };
const notFound = { '404': errorResponse('Not found'), ...ADMIN_ERRORS };

const uploadBody = mediaUploadFieldsSchema.extend({ [MEDIA_LIMITS.FILE_FIELD]: z.file() });

export const mediaPaths: ZodOpenApiPathsObject = {
  [BASE]: {
    get: adminRead(TAG, MANAGE, {
      summary: 'List media',
      requestParams: { query: mediaQuerySchema },
      responses: {
        '200': successResponse('A page of media', z.array(adminMediaDtoSchema)),
        ...ADMIN_ERRORS,
      },
    }),
    post: adminWrite(TAG, MANAGE, {
      summary: 'Upload an image',
      description:
        'Max 5 MB; JPEG, PNG, WebP or AVIF, detected from the file bytes (SVG is refused). The image is re-encoded without metadata (EXIF/GPS stripped) and stored on Cloudinary.',
      requestBody: { required: true, content: { 'multipart/form-data': { schema: uploadBody } } },
      responses: {
        '201': successResponse('Uploaded', adminMediaDtoSchema),
        '400': errorResponse('Missing file or alt text, unsupported type, or not a valid image'),
        '413': errorResponse('Larger than 5 MB'),
        '503': errorResponse('Media storage is not configured'),
        ...ADMIN_ERRORS,
      },
    }),
  },
  [`${BASE}/{id}`]: {
    get: adminRead(TAG, MANAGE, {
      summary: 'Get a media item',
      requestParams: byId,
      responses: { '200': successResponse('The media', adminMediaDtoSchema), ...notFound },
    }),
    patch: adminWrite(TAG, MANAGE, {
      summary: 'Edit the alt text',
      requestParams: byId,
      requestBody: jsonBody(updateMediaSchema),
      responses: { '200': successResponse('Updated', adminMediaDtoSchema), ...notFound },
    }),
    delete: adminWrite(TAG, MANAGE, {
      summary: 'Delete an unused media item',
      requestParams: byId,
      responses: {
        '204': { description: 'Deleted' },
        '409': errorResponse('MEDIA_IN_USE: details list every <entity>.<id>.<field> using it'),
        ...notFound,
      },
    }),
  },
  [`${BASE}/{id}/usage`]: {
    get: adminRead(TAG, MANAGE, {
      summary: 'Where a media item is used (relations and rich text)',
      requestParams: byId,
      responses: { '200': successResponse('Usages', z.array(mediaUsageDtoSchema)), ...notFound },
    }),
  },
};
