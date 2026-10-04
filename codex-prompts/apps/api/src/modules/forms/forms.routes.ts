import { Router } from 'express';

import { contactSubmissionSchema, quoteSubmissionSchema } from '@codex/shared';

import { validate } from '@/middleware/validate.js';

import { postContact, postQuote } from './forms.controller.js';
import { formRateLimit, honeypot, requireTurnstile } from './forms.middleware.js';

export const formsRouter: Router = Router();

// docs/phases/03 §6, in order: rate limit → honeypot → Turnstile → validation → save.
formsRouter.post(
  '/public/quote',
  formRateLimit('quote'),
  honeypot,
  requireTurnstile,
  validate({ body: quoteSubmissionSchema }),
  postQuote,
);
formsRouter.post(
  '/public/contact',
  formRateLimit('contact'),
  honeypot,
  requireTurnstile,
  validate({ body: contactSubmissionSchema }),
  postContact,
);
