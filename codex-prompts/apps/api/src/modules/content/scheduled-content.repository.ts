import { ContentStatus } from '@codex/shared';

import { BaseRepository } from '@/lib/base-repository.js';

export class ScheduledContentRepository extends BaseRepository {
  /** Ids of posts and projects whose publish time fell in `(from, to]`. */
  async findWentLive(from: Date, to: Date): Promise<{ posts: string[]; projects: string[] }> {
    const where = { status: ContentStatus.PUBLISHED, publishedAt: { gt: from, lte: to } };
    const select = { id: true } as const;
    const [posts, projects] = await Promise.all([
      this.db.post.findMany({ where, select }),
      this.db.project.findMany({ where, select }),
    ]);
    return { posts: posts.map(({ id }) => id), projects: projects.map(({ id }) => id) };
  }
}
