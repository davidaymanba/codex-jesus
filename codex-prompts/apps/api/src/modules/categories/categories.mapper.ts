import { localizedTextDtoSchema, type AdminCategoryDto, type CategoryDto } from '@codex/shared';

import { parseJson } from '@/modules/content/json.js';

import type { CategoryRow } from './categories.repository.js';

type CategoryCore = Pick<CategoryRow, 'id' | 'name' | 'slugAr' | 'slugEn' | 'type'>;

export function toCategoryDto(row: CategoryCore): CategoryDto {
  return {
    id: row.id,
    name: parseJson(localizedTextDtoSchema, row.name),
    slugAr: row.slugAr,
    slugEn: row.slugEn,
    type: row.type,
  };
}

export function toAdminCategoryDto(row: CategoryRow): AdminCategoryDto {
  return {
    ...toCategoryDto(row),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
