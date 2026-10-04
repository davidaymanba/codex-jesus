import { z } from 'zod';

import {
  localizedTextDtoSchema,
  socialLinkDtoSchema,
  type AdminTeamMemberDto,
  type TeamMemberDto,
} from '@codex/shared';

import { parseJson } from '@/modules/content/json.js';
import { toOptionalMediaDto } from '@/modules/content/media-dto.js';

import type { TeamMemberRow } from './team.repository.js';

export function toTeamMemberDto(row: TeamMemberRow): TeamMemberDto {
  return {
    id: row.id,
    team: row.team,
    name: parseJson(localizedTextDtoSchema, row.name),
    role: parseJson(localizedTextDtoSchema, row.role),
    bio: parseJson(localizedTextDtoSchema, row.bio),
    socials: parseJson(z.array(socialLinkDtoSchema), row.socials),
    photo: toOptionalMediaDto(row.photo),
    order: row.order,
  };
}

export function toAdminTeamMemberDto(row: TeamMemberRow): AdminTeamMemberDto {
  return {
    ...toTeamMemberDto(row),
    photoId: row.photoId,
    isVisible: row.isVisible,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
