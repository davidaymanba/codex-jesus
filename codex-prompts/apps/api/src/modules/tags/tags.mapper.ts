import { localizedTextDtoSchema, type AdminTagDto, type TagDto } from '@codex/shared';

import { parseJson } from '@/modules/content/json.js';

import type { TagRow } from './tags.repository.js';

export function toTagDto(row: Pick<TagRow, 'id' | 'name' | 'slugAr' | 'slugEn'>): TagDto {
  return {
    id: row.id,
    name: parseJson(localizedTextDtoSchema, row.name),
    slugAr: row.slugAr,
    slugEn: row.slugEn,
  };
}

export function toAdminTagDto(row: TagRow): AdminTagDto {
  return {
    ...toTagDto(row),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
