import type { Request, Response } from 'express';

import type { ContactSubmissionInput, QuoteSubmissionInput } from '@codex/shared';

import type { BodyRequest } from '@/middleware/validate.js';
import { sendCreated } from '@/utils/response.js';

import { submitContact, submitQuote } from './forms.service.js';

const clientOf = (req: Request) => ({ ip: req.ip, userAgent: req.get('user-agent') });
// Minimal body: nothing about what was stored (no ids to enumerate).
const RECEIPT = { received: true } as const;

export async function postQuote(
  req: BodyRequest<QuoteSubmissionInput>,
  res: Response,
): Promise<void> {
  await submitQuote(req.body, clientOf(req));
  sendCreated(res, RECEIPT);
}

export async function postContact(
  req: BodyRequest<ContactSubmissionInput>,
  res: Response,
): Promise<void> {
  await submitContact(req.body, clientOf(req));
  sendCreated(res, RECEIPT);
}
