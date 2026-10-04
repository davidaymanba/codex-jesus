import type { Response } from 'express';

import type {
  IdParams,
  QuoteRequestExportQuery,
  QuoteRequestQuery,
  UpdateQuoteRequestInput,
} from '@codex/shared';

import type { QueryRequest, ValidRequest } from '@/middleware/validate.js';
import { actorOf } from '@/modules/auth/actor.js';
import { startCsvDownload } from '@/modules/leads/csv-response.js';
import { sendSuccess } from '@/utils/response.js';

import { exportQuotes, getQuote, listQuotes, updateQuote } from './quotes.service.js';

export async function getQuotes(
  req: QueryRequest<QuoteRequestQuery>,
  res: Response,
): Promise<void> {
  const { items, meta } = await listQuotes(req.query);
  sendSuccess(res, items, meta);
}

export async function getQuoteById(req: ValidRequest<IdParams>, res: Response): Promise<void> {
  sendSuccess(res, await getQuote(req.params.id));
}

export async function patchQuote(
  req: ValidRequest<IdParams, UpdateQuoteRequestInput>,
  res: Response,
): Promise<void> {
  sendSuccess(res, await updateQuote(req.params.id, req.body, actorOf(req)));
}

export async function getQuotesCsv(
  req: QueryRequest<QuoteRequestExportQuery>,
  res: Response,
): Promise<void> {
  startCsvDownload(res, 'quote-requests');
  await exportQuotes(req.query, res, actorOf(req));
  res.end();
}
