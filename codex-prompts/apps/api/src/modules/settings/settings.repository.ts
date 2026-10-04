import type { SiteSettingsInput } from '@codex/shared';

import type { Prisma } from '@/generated/prisma/client.js';
import { BaseRepository } from '@/lib/base-repository.js';
import { MEDIA_DTO_SELECT } from '@/modules/content/media-dto.js';

/** The singleton row (a CHECK constraint keeps it at id 1). */
export const SETTINGS_ID = 1;

export const SETTINGS_SELECT = {
  companyName: true,
  logoId: true,
  logo: { select: MEDIA_DTO_SELECT },
  contact: true,
  socials: true,
  defaultSeo: true,
  ogImageId: true,
  ogImage: { select: MEDIA_DTO_SELECT },
  homepage: true,
  updatedAt: true,
} as const satisfies Prisma.SiteSettingsSelect;

export type SettingsRow = Prisma.SiteSettingsGetPayload<{ select: typeof SETTINGS_SELECT }>;

export class SettingsRepository extends BaseRepository {
  find(): Promise<SettingsRow | null> {
    return this.db.siteSettings.findUnique({ where: { id: SETTINGS_ID }, select: SETTINGS_SELECT });
  }

  /** Replaces the whole document (creates it on first save). */
  save(input: SiteSettingsInput): Promise<SettingsRow> {
    const data = { ...input, logoId: input.logoId ?? null, ogImageId: input.ogImageId ?? null };
    return this.db.siteSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...data },
      update: data,
      select: SETTINGS_SELECT,
    });
  }

  countProjects(ids: readonly string[]): Promise<number> {
    return this.db.project.count({ where: { id: { in: [...ids] } } });
  }
}
