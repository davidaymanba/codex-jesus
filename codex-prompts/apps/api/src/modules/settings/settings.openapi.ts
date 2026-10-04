import type { ZodOpenApiPathsObject } from 'zod-openapi';

import {
  adminSiteSettingsDtoSchema,
  Permission,
  siteSettingsDtoSchema,
  siteSettingsSchema,
} from '@codex/shared';

import { API_PREFIX } from '@/config/constants.js';
import { ADMIN_ERRORS, adminRead, adminWrite, publicRead } from '@/modules/docs/crud-openapi.js';
import {
  COMMON_ERRORS,
  errorResponse,
  jsonBody,
  successResponse,
} from '@/modules/docs/openapi-helpers.js';

const TAG = 'Settings';
const MANAGE = Permission.SETTINGS_MANAGE;

export const settingsPaths: ZodOpenApiPathsObject = {
  [`${API_PREFIX}/public/settings`]: {
    get: publicRead(TAG, {
      summary: 'Site settings: company, contact, socials, default SEO, homepage',
      responses: {
        '200': successResponse('Settings', siteSettingsDtoSchema),
        '404': errorResponse('Not configured yet'),
        ...COMMON_ERRORS,
      },
    }),
  },
  [`${API_PREFIX}/admin/settings`]: {
    get: adminRead(TAG, MANAGE, {
      summary: 'Site settings with media ids',
      responses: {
        '200': successResponse('Settings', adminSiteSettingsDtoSchema),
        '404': errorResponse('Not configured yet'),
        ...ADMIN_ERRORS,
      },
    }),
    put: adminWrite(TAG, MANAGE, {
      summary: 'Replace the site settings (creates them on first save)',
      requestBody: jsonBody(siteSettingsSchema),
      responses: {
        '200': successResponse('Saved', adminSiteSettingsDtoSchema),
        '400': errorResponse('Invalid input or unknown featured project'),
        '409': errorResponse('A referenced media id does not exist'),
        ...ADMIN_ERRORS,
      },
    }),
  },
};
