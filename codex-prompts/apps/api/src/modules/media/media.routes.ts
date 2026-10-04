import { Router } from 'express';

import {
  idParamsSchema,
  mediaQuerySchema,
  mediaUploadFieldsSchema,
  Permission,
  updateMediaSchema,
} from '@codex/shared';

import { validate } from '@/middleware/validate.js';
import { permitted } from '@/modules/auth/permitted.js';

import {
  getMediaById,
  getMediaList,
  getMediaUsageById,
  patchMedia,
  postMedia,
  removeMedia,
} from './media.controller.js';
import { parseUpload } from './media.upload.js';

const MANAGE = Permission.MEDIA_MANAGE;
const byId = { params: idParamsSchema };

export const mediaRouter: Router = Router();

mediaRouter.get('/admin/media', permitted(MANAGE, { query: mediaQuerySchema }), getMediaList);
// Permission before parsing: nobody without access gets to stream a file into memory.
mediaRouter.post(
  '/admin/media',
  permitted(MANAGE),
  parseUpload,
  validate({ body: mediaUploadFieldsSchema }),
  postMedia,
);
mediaRouter.get('/admin/media/:id', permitted(MANAGE, byId), getMediaById);
mediaRouter.get('/admin/media/:id/usage', permitted(MANAGE, byId), getMediaUsageById);
mediaRouter.patch(
  '/admin/media/:id',
  permitted(MANAGE, { ...byId, body: updateMediaSchema }),
  patchMedia,
);
mediaRouter.delete('/admin/media/:id', permitted(MANAGE, byId), removeMedia);
