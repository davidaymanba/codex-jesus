import type { RequestHandler } from 'express';

/**
 * Public reads may be cached, but must be revalidated on every use: Express adds an ETag, so
 * an unchanged response costs a 304. Freshness itself comes from the web app's tag cache and
 * the revalidation webhook, so no max-age that would delay a publish.
 */
export const publicCacheHeaders: RequestHandler = (req, res, next) => {
  if (req.method === 'GET') res.setHeader('Cache-Control', 'public, no-cache');
  next();
};
