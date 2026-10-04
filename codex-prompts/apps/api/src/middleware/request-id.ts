import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

import type { RequestHandler } from 'express';

import { REQUEST_ID_HEADER } from '@codex/shared';

// Accept upstream ids (e.g. from a proxy) only when they are short and plain, so a client
// cannot inject newlines or huge values into the logs.
const REQUEST_ID_PATTERN = /^[\w-]{8,64}$/;

/** Propagates a well-formed `X-Request-Id` or generates one, and echoes it on the response. */
export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.get(REQUEST_ID_HEADER);
  req.id = incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
  res.setHeader(REQUEST_ID_HEADER, req.id);
  next();
};

/** The request id set by `requestId` (pino-http types `req.id` loosely). */
export function getRequestId(req: IncomingMessage): string {
  return typeof req.id === 'string' ? req.id : '';
}
