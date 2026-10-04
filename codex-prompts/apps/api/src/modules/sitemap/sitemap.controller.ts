import type { Request, Response } from 'express';

import { sendSuccess } from '@/utils/response.js';

import { getSitemapData } from './sitemap.service.js';

export async function getSitemap(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await getSitemapData());
}
