import { Router } from 'express';

import { Permission, siteSettingsSchema } from '@codex/shared';

import { permitted } from '@/modules/auth/permitted.js';

import { getPublicSiteSettings, getSiteSettings, putSiteSettings } from './settings.controller.js';

// ADMIN only (docs/phases/03 §4): EDITOR has no SETTINGS_MANAGE.
const MANAGE = Permission.SETTINGS_MANAGE;

export const settingsRouter: Router = Router();

settingsRouter.get('/public/settings', getPublicSiteSettings);
settingsRouter.get('/admin/settings', permitted(MANAGE), getSiteSettings);
settingsRouter.put(
  '/admin/settings',
  permitted(MANAGE, { body: siteSettingsSchema }),
  putSiteSettings,
);
