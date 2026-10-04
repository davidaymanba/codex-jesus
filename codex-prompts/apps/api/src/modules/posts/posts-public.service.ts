import {
  CACHE_TAGS,
  type Locale,
  type PaginationMeta,
  type PostDto,
  type PostSummaryDto,
  type PublicPostQuery,
} from '@codex/shared';

import { RELATED_POSTS_LIMIT } from '@/config/constants.js';
import { NotFoundError } from '@/lib/errors.js';
import { queryKey, readPublic } from '@/modules/content/public-cache.js';
import { slugFieldOf } from '@/modules/content/slugs.js';
import { paginate } from '@/utils/pagination.js';

import { toPostDto, toPostSummaryDto } from './posts.mapper.js';
import { PostRepository } from './posts.repository.js';

const posts = new PostRepository();
// Posts embed categories, tags, media and the author's name.
const READ_TAGS = [CACHE_TAGS.POSTS, CACHE_TAGS.CATEGORIES, CACHE_TAGS.TAGS, CACHE_TAGS.MEDIA];
const nextChangeAt = () => posts.nextScheduledAt(new Date());

export function listPublicPosts(
  query: PublicPostQuery,
): Promise<{ items: PostSummaryDto[]; meta: PaginationMeta }> {
  return readPublic({
    key: queryKey('posts:list', query),
    tags: READ_TAGS,
    nextChangeAt,
    load: async () => {
      const page = paginate(query);
      const searchTerm = query.q ? await posts.normalizeSearchTerm(query.q) : undefined;
      const filters = {
        category: query.category,
        tag: query.tag,
        featured: query.featured,
        searchTerm,
      };
      const { rows, total } = await posts.listPublished(filters, page, new Date());
      return { items: rows.map(toPostSummaryDto), meta: page.toMeta(total) };
    },
  });
}

export async function getPublicPost(slug: string, locale: Locale): Promise<PostDto> {
  const post = await readPublic({
    key: `posts:${locale}:${slug}`,
    tags: READ_TAGS,
    nextChangeAt,
    load: async () => {
      const row = await posts.findPublishedBySlug(slugFieldOf(locale), slug, new Date());
      return row ? toPostDto(row) : null;
    },
  });
  if (!post) throw new NotFoundError();
  return post;
}

/**
 * Up to RELATED_POSTS_LIMIT published posts sharing a category or tag, newest first; topped
 * up with the latest posts so the section is never empty while other posts exist.
 */
export async function getRelatedPosts(slug: string, locale: Locale): Promise<PostSummaryDto[]> {
  const related = await readPublic({
    key: `posts:related:${locale}:${slug}`,
    tags: READ_TAGS,
    nextChangeAt,
    load: async () => {
      const now = new Date();
      const post = await posts.findPublishedBySlug(slugFieldOf(locale), slug, now);
      if (!post) return null;
      const matches = await posts.findRelated(post, RELATED_POSTS_LIMIT, now);
      const missing = RELATED_POSTS_LIMIT - matches.length;
      const excluded = [post.id, ...matches.map(({ id }) => id)];
      const latest = missing > 0 ? await posts.findLatest(excluded, missing, now) : [];
      return [...matches, ...latest].map(toPostSummaryDto);
    },
  });
  if (!related) throw new NotFoundError();
  return related;
}
