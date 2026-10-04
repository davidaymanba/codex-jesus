import {
  AuditAction,
  AuditEntity,
  CACHE_TAGS,
  VALIDATION_MESSAGES as MSG,
  type AdminSiteSettingsDto,
  type SiteSettingsDto,
  type SiteSettingsInput,
} from '@codex/shared';

import { withTransaction } from '@/lib/base-repository.js';
import { NotFoundError, ValidationError } from '@/lib/errors.js';
import type { Actor } from '@/modules/auth/actor.js';
import { auditWrite, diffOf } from '@/modules/content/audit.js';
import { readPublic } from '@/modules/content/public-cache.js';
import { publishChanges } from '@/modules/content/publish-changes.js';

import { toAdminSiteSettingsDto, toSiteSettingsDto } from './settings.mapper.js';
import { SETTINGS_ID, SettingsRepository } from './settings.repository.js';

const settings = new SettingsRepository();

export async function getPublicSettings(): Promise<SiteSettingsDto> {
  const dto = await readPublic({
    key: 'settings',
    tags: [CACHE_TAGS.SETTINGS, CACHE_TAGS.MEDIA],
    load: async () => {
      const row = await settings.find();
      return row ? toSiteSettingsDto(row) : null;
    },
  });
  if (!dto) throw new NotFoundError();
  return dto;
}

export async function getSettings(): Promise<AdminSiteSettingsDto> {
  const row = await settings.find();
  if (!row) throw new NotFoundError();
  return toAdminSiteSettingsDto(row);
}

/** Replaces the site settings document; featured projects must exist. */
export async function saveSettings(
  input: SiteSettingsInput,
  actor: Actor,
): Promise<AdminSiteSettingsDto> {
  const { featuredProjectIds } = input.homepage;
  if ((await settings.countProjects(featuredProjectIds)) !== featuredProjectIds.length) {
    throw new ValidationError([{ path: 'homepage.featuredProjectIds', message: MSG.INVALID_ID }]);
  }
  const current = await settings.find();
  const before = current ? toAdminSiteSettingsDto(current) : {};
  const saved = await withTransaction(async (tx) => {
    const after = toAdminSiteSettingsDto(await new SettingsRepository(tx).save(input));
    await auditWrite(tx, actor, {
      action: current ? AuditAction.UPDATE : AuditAction.CREATE,
      entity: AuditEntity.SITE_SETTINGS,
      entityId: String(SETTINGS_ID),
      changes: diffOf(before, after),
    });
    return after;
  });
  await publishChanges([CACHE_TAGS.SETTINGS]);
  return saved;
}
