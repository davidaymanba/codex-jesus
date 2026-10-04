import { Router } from 'express';

import {
  contactMessageExportQuerySchema,
  contactMessageQuerySchema,
  idParamsSchema,
  Permission,
  updateContactMessageSchema,
} from '@codex/shared';

import { permitted } from '@/modules/auth/permitted.js';

import { getMessageById, getMessages, getMessagesCsv, patchMessage } from './contact.controller.js';

export const contactRouter: Router = Router();

contactRouter.get(
  '/admin/messages',
  permitted(Permission.LEADS_READ, { query: contactMessageQuerySchema }),
  getMessages,
);
contactRouter.get(
  '/admin/messages/export.csv',
  permitted(Permission.LEADS_READ, { query: contactMessageExportQuerySchema }),
  getMessagesCsv,
);
contactRouter.get(
  '/admin/messages/:id',
  permitted(Permission.LEADS_READ, { params: idParamsSchema }),
  getMessageById,
);
contactRouter.patch(
  '/admin/messages/:id',
  permitted(Permission.LEADS_UPDATE, { params: idParamsSchema, body: updateContactMessageSchema }),
  patchMessage,
);
