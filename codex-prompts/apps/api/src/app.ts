import compression from 'compression';
import cookieParser from 'cookie-parser';
import express, { json, Router, type Express } from 'express';

import {
  ADMIN_PATH,
  API_PREFIX,
  DOCS_PATH,
  HEALTH_PATH,
  JSON_BODY_LIMIT,
  PUBLIC_PATH,
} from '@/config/constants.js';
import { env } from '@/config/env.js';
import { errorHandler, notFoundHandler } from '@/middleware/error-handler.js';
import { httpLogger } from '@/middleware/http-logger.js';
import { publicCacheHeaders } from '@/middleware/public-cache.js';
import { requestId } from '@/middleware/request-id.js';
import { corsPolicy, securityHeaders, verifyOrigin } from '@/middleware/security.js';
import { trafficLimits } from '@/middleware/traffic-limits.js';
import { adminGate } from '@/modules/auth/admin-gate.js';
import { createDocsRouter } from '@/modules/docs/docs.routes.js';
import { healthRouter } from '@/modules/health/health.routes.js';
import { apiRouters } from '@/routes.js';

interface AppOptions {
  /** Extra routers mounted under the API prefix (tests use it to add probe routes). */
  routers?: Router[];
}

/**
 * Builds the Express app without listening, so tests can mount it directly. The middleware
 * order follows docs/phases/02-backend-core.md §1.
 */
export function createApp({ routers = [] }: AppOptions = {}): Express {
  const app = express();
  app.disable('x-powered-by');
  // Only the configured number of proxy hops may set X-Forwarded-For (client IP for limits).
  app.set('trust proxy', env.TRUST_PROXY_HOPS);

  app.use(requestId);
  app.use(httpLogger);
  app.use(securityHeaders);
  app.use(corsPolicy);
  app.use(compression());
  app.use(json({ limit: JSON_BODY_LIMIT }));
  app.use(cookieParser());
  app.use(trafficLimits());
  app.use(verifyOrigin);

  app.use(HEALTH_PATH, healthRouter);
  const docsRouter = createDocsRouter();
  if (docsRouter) app.use(DOCS_PATH, docsRouter);
  const api = Router();
  // Group gates run once per request; module routers define full paths (`/admin/posts`).
  api.use(PUBLIC_PATH, publicCacheHeaders);
  api.use(ADMIN_PATH, adminGate());
  for (const router of [...apiRouters, ...routers]) api.use(router);
  app.use(API_PREFIX, api);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
