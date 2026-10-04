import { Router } from 'express';

import { getSitemap } from './sitemap.controller.js';

export const sitemapRouter: Router = Router();

sitemapRouter.get('/public/sitemap-data', getSitemap);
