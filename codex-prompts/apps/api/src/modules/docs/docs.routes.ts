import { timingSafeEqual } from 'node:crypto';

import { Router, type RequestHandler } from 'express';
import { serve as serveSwaggerUi, setup as setupSwaggerUi } from 'swagger-ui-express';

import { env } from '@/config/env.js';
import { UnauthorizedError } from '@/lib/errors.js';

import { buildOpenApiDocument } from './openapi.js';

// Swagger UI loads its own scripts and an inline style block from this path only.
const DOCS_CSP = [
  "default-src 'self'",
  "img-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self'",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join(';');

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function basicAuth(username: string, password: string): RequestHandler {
  const expected = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  return (req, res, next) => {
    if (safeEqual(req.get('authorization') ?? '', expected)) {
      next();
      return;
    }
    res.setHeader('WWW-Authenticate', 'Basic realm="Codex API docs", charset="UTF-8"');
    next(new UnauthorizedError());
  };
}

const docsCsp: RequestHandler = (_req, res, next) => {
  res.setHeader('Content-Security-Policy', DOCS_CSP);
  next();
};

/**
 * Swagger UI and the raw document. Outside production they are open; in production they exist
 * only when DOCS_USERNAME/DOCS_PASSWORD are set, and then (in every environment) behind basic auth.
 */
export function createDocsRouter(): Router | undefined {
  const credentials =
    env.DOCS_USERNAME && env.DOCS_PASSWORD
      ? { username: env.DOCS_USERNAME, password: env.DOCS_PASSWORD }
      : undefined;
  if (env.NODE_ENV === 'production' && !credentials) return undefined;

  const document = buildOpenApiDocument();
  const router = Router();
  if (credentials) router.use(basicAuth(credentials.username, credentials.password));
  router.use(docsCsp);
  router.get('/openapi.json', (_req, res) => {
    res.json(document);
  });
  router.use('/', serveSwaggerUi, setupSwaggerUi(document, { customSiteTitle: 'Codex API' }));
  return router;
}
