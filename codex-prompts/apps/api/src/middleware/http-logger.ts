import type { IncomingMessage, ServerResponse } from 'node:http';

import { pinoHttp } from 'pino-http';

import { HEALTH_PATH } from '@/config/constants.js';
import { logger } from '@/lib/logger.js';

const SERVER_ERROR_STATUS = 500;
const CLIENT_ERROR_STATUS = 400;

/** Path without the query string: queries can carry search terms or emails (PII). */
function pathOf(url: string | undefined): string {
  return (url ?? '').split('?')[0] ?? '';
}

/** Express rewrites `req.url` inside mounted routers; `originalUrl` keeps the full path. */
function fullPathOf(req: IncomingMessage): string {
  const originalUrl: unknown = 'originalUrl' in req ? req.originalUrl : undefined;
  return pathOf(typeof originalUrl === 'string' ? originalUrl : req.url);
}

/**
 * One structured line per response. Bodies, headers, cookies and IPs are never logged; the
 * request id ties the line to the client's `X-Request-Id` and to error responses.
 */
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => req.id,
  autoLogging: { ignore: (req) => fullPathOf(req).startsWith(HEALTH_PATH) },
  customLogLevel: (_req, res, error) => {
    if (error || res.statusCode >= SERVER_ERROR_STATUS) return 'error';
    return res.statusCode >= CLIENT_ERROR_STATUS ? 'warn' : 'info';
  },
  serializers: {
    req: (req: IncomingMessage) => ({ id: req.id, method: req.method, path: fullPathOf(req) }),
    res: (res: ServerResponse) => ({ statusCode: res.statusCode }),
  },
  customSuccessMessage: (req, res) => `${req.method ?? ''} ${fullPathOf(req)} ${res.statusCode}`,
  customErrorMessage: (req, res) => `${req.method ?? ''} ${fullPathOf(req)} ${res.statusCode}`,
});
