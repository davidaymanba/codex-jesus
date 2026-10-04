import type {
  PublicTeamQuery,
  TeamMemberQuery,
  CreateTeamMemberInput,
  UpdateTeamMemberInput,
} from '@codex/shared';

import type { Prisma } from '@/generated/prisma/client.js';
import { BaseRepository } from '@/lib/base-repository.js';
import { MEDIA_DTO_SELECT } from '@/modules/content/media-dto.js';
import { withoutUndefined } from '@/utils/objects.js';
import { orderByOf } from '@/utils/sort.js';

export const TEAM_MEMBER_SELECT = {
  id: true,
  team: true,
  name: true,
  role: true,
  bio: true,
  socials: true,
  photoId: true,
  order: true,
  isVisible: true,
  createdAt: true,
  updatedAt: true,
  photo: { select: MEDIA_DTO_SELECT },
} as const satisfies Prisma.TeamMemberSelect;

export type TeamMemberRow = Prisma.TeamMemberGetPayload<{ select: typeof TEAM_MEMBER_SELECT }>;

interface Page {
  skip: number;
  take: number;
}

export class TeamMemberRepository extends BaseRepository {
  async list(query: TeamMemberQuery, page: Page) {
    const where: Prisma.TeamMemberWhereInput = {
      ...(query.isVisible !== undefined && { isVisible: query.isVisible }),
      ...(query.team && { team: query.team }),
    };
    const [rows, total] = await Promise.all([
      this.db.teamMember.findMany({
        where,
        select: TEAM_MEMBER_SELECT,
        orderBy: orderByOf(query.sortBy, query.sortOrder),
        skip: page.skip,
        take: page.take,
      }),
      this.db.teamMember.count({ where }),
    ]);
    return { rows, total };
  }

  /** Visible items in their arranged order, for the public site. */
  async listVisible(query: PublicTeamQuery, page: Page) {
    const where: Prisma.TeamMemberWhereInput = {
      isVisible: true,
      ...(query.team && { team: query.team }),
    };
    const [rows, total] = await Promise.all([
      this.db.teamMember.findMany({
        where,
        select: TEAM_MEMBER_SELECT,
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
        skip: page.skip,
        take: page.take,
      }),
      this.db.teamMember.count({ where }),
    ]);
    return { rows, total };
  }

  findById(id: string): Promise<TeamMemberRow | null> {
    return this.db.teamMember.findUnique({ where: { id }, select: TEAM_MEMBER_SELECT });
  }

  create(input: CreateTeamMemberInput): Promise<TeamMemberRow> {
    const { photoId, ...fields } = input;
    return this.db.teamMember.create({
      data: {
        ...fields,
        photoId: photoId ?? null,
      },
      select: TEAM_MEMBER_SELECT,
    });
  }

  update(id: string, input: UpdateTeamMemberInput): Promise<TeamMemberRow> {
    return this.db.teamMember.update({
      where: { id },
      data: withoutUndefined(input),
      select: TEAM_MEMBER_SELECT,
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.teamMember.delete({ where: { id }, select: { id: true } });
  }
}
