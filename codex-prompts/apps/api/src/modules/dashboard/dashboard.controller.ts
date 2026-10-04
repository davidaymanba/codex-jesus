import type { Request, Response } from 'express';

import { sendSuccess } from '@/utils/response.js';

import { getDashboardStats } from './dashboard.service.js';

export async function getStats(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await getDashboardStats());
}
