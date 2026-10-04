import type { Request, Response } from 'express';

import type { SiteSettingsInput } from '@codex/shared';

import type { BodyRequest } from '@/middleware/validate.js';
import { actorOf } from '@/modules/auth/actor.js';
import { sendSuccess } from '@/utils/response.js';

import { getPublicSettings, getSettings, saveSettings } from './settings.service.js';

export async function getPublicSiteSettings(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await getPublicSettings());
}

export async function getSiteSettings(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await getSettings());
}

export async function putSiteSettings(
  req: BodyRequest<SiteSettingsInput>,
  res: Response,
): Promise<void> {
  sendSuccess(res, await saveSettings(req.body, actorOf(req)));
}
