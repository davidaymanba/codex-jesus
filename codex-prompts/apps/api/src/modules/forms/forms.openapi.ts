import type { z } from 'zod';
import type { ZodOpenApiOperationObject, ZodOpenApiPathsObject } from 'zod-openapi';

import {
  contactSubmissionSchema,
  formReceiptDtoSchema,
  quoteSubmissionSchema,
} from '@codex/shared';

import { API_PREFIX } from '@/config/constants.js';
import {
  COMMON_ERRORS,
  errorResponse,
  jsonBody,
  successResponse,
} from '@/modules/docs/openapi-helpers.js';

const DESCRIPTION =
  '5 submissions per hour per IP. Bot protection: a Turnstile token, and the `website` honeypot ' +
  '(filled: 201 but nothing is stored). Queues the company notification and a confirmation email.';

function submission(summary: string, body: z.ZodType): ZodOpenApiOperationObject {
  return {
    tags: ['Forms'],
    summary,
    description: DESCRIPTION,
    requestBody: jsonBody(body),
    responses: {
      '201': successResponse('Received', formReceiptDtoSchema),
      '400': errorResponse('Invalid input (i18n keys per field)'),
      '403': errorResponse('BOT_CHECK_FAILED, or a foreign Origin'),
      ...COMMON_ERRORS,
    },
  };
}

export const formPaths: ZodOpenApiPathsObject = {
  [`${API_PREFIX}/public/quote`]: { post: submission('Request a quote', quoteSubmissionSchema) },
  [`${API_PREFIX}/public/contact`]: {
    post: submission('Send a contact message', contactSubmissionSchema),
  },
};
