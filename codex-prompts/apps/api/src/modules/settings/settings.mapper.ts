import {
  adminSiteSettingsDtoSchema,
  siteSettingsDtoSchema,
  type AdminSiteSettingsDto,
  type SiteSettingsDto,
} from '@codex/shared';

import { parseJson } from '@/modules/content/json.js';
import { toOptionalMediaDto } from '@/modules/content/media-dto.js';

import type { SettingsRow } from './settings.repository.js';

const { shape } = siteSettingsDtoSchema;

export function toSiteSettingsDto(row: SettingsRow): SiteSettingsDto {
  return {
    companyName: parseJson(shape.companyName, row.companyName),
    logo: toOptionalMediaDto(row.logo),
    contact: parseJson(shape.contact, row.contact),
    socials: parseJson(shape.socials, row.socials),
    defaultSeo: parseJson(shape.defaultSeo, row.defaultSeo),
    ogImage: toOptionalMediaDto(row.ogImage),
    homepage: parseJson(shape.homepage, row.homepage),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toAdminSiteSettingsDto(row: SettingsRow): AdminSiteSettingsDto {
  return {
    ...toSiteSettingsDto(row),
    homepage: parseJson(adminSiteSettingsDtoSchema.shape.homepage, row.homepage),
    logoId: row.logoId,
    ogImageId: row.ogImageId,
  };
}
