import { Router } from 'express';

import {
  idParamsSchema,
  Permission,
  quoteRequestExportQuerySchema,
  quoteRequestQuerySchema,
  updateQuoteRequestSchema,
} from '@codex/shared';

import { permitted } from '@/modules/auth/permitted.js';

import { getQuoteById, getQuotes, getQuotesCsv, patchQuote } from './quotes.controller.js';

export const quotesRouter: Router = Router();

quotesRouter.get(
  '/admin/quotes',
  permitted(Permission.LEADS_READ, { query: quoteRequestQuerySchema }),
  getQuotes,
);
// Before `/:id`, so "export.csv" is never read as an id.
quotesRouter.get(
  '/admin/quotes/export.csv',
  permitted(Permission.LEADS_READ, { query: quoteRequestExportQuerySchema }),
  getQuotesCsv,
);
quotesRouter.get(
  '/admin/quotes/:id',
  permitted(Permission.LEADS_READ, { params: idParamsSchema }),
  getQuoteById,
);
quotesRouter.patch(
  '/admin/quotes/:id',
  permitted(Permission.LEADS_UPDATE, { params: idParamsSchema, body: updateQuoteRequestSchema }),
  patchQuote,
);
