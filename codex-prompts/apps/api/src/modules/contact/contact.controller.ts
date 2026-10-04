import type { Response } from 'express';

import type {
  ContactMessageExportQuery,
  ContactMessageQuery,
  IdParams,
  UpdateContactMessageInput,
} from '@codex/shared';

import type { QueryRequest, ValidRequest } from '@/middleware/validate.js';
import { actorOf } from '@/modules/auth/actor.js';
import { startCsvDownload } from '@/modules/leads/csv-response.js';
import { sendSuccess } from '@/utils/response.js';

import {
  exportContactMessages,
  getContactMessage,
  listContactMessages,
  updateContactMessage,
} from './contact.service.js';

export async function getMessages(
  req: QueryRequest<ContactMessageQuery>,
  res: Response,
): Promise<void> {
  const { items, meta } = await listContactMessages(req.query);
  sendSuccess(res, items, meta);
}

export async function getMessageById(req: ValidRequest<IdParams>, res: Response): Promise<void> {
  sendSuccess(res, await getContactMessage(req.params.id));
}

export async function patchMessage(
  req: ValidRequest<IdParams, UpdateContactMessageInput>,
  res: Response,
): Promise<void> {
  sendSuccess(res, await updateContactMessage(req.params.id, req.body, actorOf(req)));
}

export async function getMessagesCsv(
  req: QueryRequest<ContactMessageExportQuery>,
  res: Response,
): Promise<void> {
  startCsvDownload(res, 'contact-messages');
  await exportContactMessages(req.query, res, actorOf(req));
  res.end();
}
