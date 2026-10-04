import { type AdminClientDto, type ClientDto } from '@codex/shared';

import { toOptionalMediaDto } from '@/modules/content/media-dto.js';

import type { ClientRow } from './clients.repository.js';

export function toClientDto(row: ClientRow): ClientDto {
  return {
    id: row.id,
    name: row.name,
    website: row.website,
    logo: toOptionalMediaDto(row.logo),
    order: row.order,
  };
}

export function toAdminClientDto(row: ClientRow): AdminClientDto {
  return {
    ...toClientDto(row),
    logoId: row.logoId,
    isVisible: row.isVisible,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
