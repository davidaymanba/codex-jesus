import {
  AuditAction,
  AuditEntity,
  CACHE_TAGS,
  calculateReadingTime,
  entityTag,
  VALIDATION_MESSAGES as MSG,
  type AdminPostDto,
  type CreatePostInput,
  type LocalizedRichText,
  type PaginationMeta,
  type PostQuery,
  type UpdatePostInput,
} from '@codex/shared';

import { withTransaction } from '@/lib/base-repository.js';
import { NotFoundError, ValidationError } from '@/lib/errors.js';
import type { Actor } from '@/modules/auth/actor.js';
import { auditWrite, diffOf } from '@/modules/content/audit.js';
import { resolvePublishedAt } from '@/modules/content/publication.js';
import { publishChanges } from '@/modules/content/publish-changes.js';
import { slugsForCreate, slugsForUpdate } from '@/modules/content/slugs.js';
import { paginate } from '@/utils/pagination.js';

import { toAdminPostDto } from './posts.mapper.js';
import { PostRepository } from './posts.repository.js';

const posts = new PostRepository();
const changedTags = (id: string) => [
  CACHE_TAGS.POSTS,
  entityTag(CACHE_TAGS.POSTS, id),
  CACHE_TAGS.SITEMAP,
];

const readingTimeOf = (content: LocalizedRichText) => ({
  ar: calculateReadingTime(content.ar, 'ar'),
  en: calculateReadingTime(content.en, 'en'),
});

export async function listPosts(
  query: PostQuery,
): Promise<{ items: AdminPostDto[]; meta: PaginationMeta }> {
  const page = paginate(query);
  const searchTerm = query.q ? await posts.normalizeSearchTerm(query.q) : undefined;
  const filters = {
    category: query.category,
    tag: query.tag,
    featured: query.isFeatured,
    searchTerm,
  };
  const { rows, total } = await posts.list(query, filters, page);
  return { items: rows.map(toAdminPostDto), meta: page.toMeta(total) };
}

async function findOrFail(id: string, repository = posts) {
  const row = await repository.findById(id);
  if (!row) throw new NotFoundError();
  return row;
}

export async function getPost(id: string): Promise<AdminPostDto> {
  return toAdminPostDto(await findOrFail(id));
}

/** Only blog categories and existing tags may be attached. */
async function assertRelations(input: {
  categoryIds?: string[] | undefined;
  tagIds?: string[] | undefined;
}) {
  const { categoryIds = [], tagIds = [] } = input;
  if (
    categoryIds.length > 0 &&
    (await posts.countPostCategories(categoryIds)) !== categoryIds.length
  ) {
    throw new ValidationError([{ path: 'categoryIds', message: MSG.INVALID_ID }]);
  }
  if (tagIds.length > 0 && (await posts.countTags(tagIds)) !== tagIds.length) {
    throw new ValidationError([{ path: 'tagIds', message: MSG.INVALID_ID }]);
  }
}

/** Creates a post authored by the signed-in user; reading time comes from the content. */
export async function createPost(input: CreatePostInput, actor: Actor): Promise<AdminPostDto> {
  await assertRelations(input);
  const slugs = await slugsForCreate(posts, input.title, input);
  const { categoryIds, tagIds, publishedAt, ...fields } = input;
  const extras = {
    categoryIds,
    tagIds,
    readingTime: readingTimeOf(input.content),
    publishedAt: resolvePublishedAt(input.status, publishedAt, null, new Date()) ?? null,
  };
  const created = await withTransaction(async (tx) => {
    const post = toAdminPostDto(
      await new PostRepository(tx).create({ ...fields, ...slugs, authorId: actor.userId }, extras),
    );
    await auditWrite(tx, actor, {
      action: AuditAction.CREATE,
      entity: AuditEntity.POST,
      entityId: post.id,
      changes: { ...input, ...slugs },
    });
    return post;
  });
  await publishChanges(changedTags(created.id));
  return created;
}

export async function updatePost(
  id: string,
  input: UpdatePostInput,
  actor: Actor,
): Promise<AdminPostDto> {
  const row = await findOrFail(id);
  const before = toAdminPostDto(row);
  await assertRelations(input);
  const slugs = await slugsForUpdate(posts, id, input);
  const { categoryIds, tagIds, publishedAt, ...fields } = input;
  const extras = {
    ...(categoryIds && { categoryIds }),
    ...(tagIds && { tagIds }),
    ...(input.content && { readingTime: readingTimeOf(input.content) }),
    publishedAt: resolvePublishedAt(
      input.status ?? row.status,
      publishedAt,
      row.publishedAt,
      new Date(),
    ),
  };
  const updated = await withTransaction(async (tx) => {
    const after = toAdminPostDto(
      await new PostRepository(tx).update(id, { ...fields, ...slugs }, extras),
    );
    await auditWrite(tx, actor, {
      action: before.status === after.status ? AuditAction.UPDATE : AuditAction.STATUS_CHANGE,
      entity: AuditEntity.POST,
      entityId: id,
      changes: diffOf(before, after),
    });
    return after;
  });
  await publishChanges(changedTags(id));
  return updated;
}

export async function deletePost(id: string, actor: Actor): Promise<void> {
  await withTransaction(async (tx) => {
    const repository = new PostRepository(tx);
    const row = await findOrFail(id, repository);
    await repository.delete(id);
    await auditWrite(tx, actor, {
      action: AuditAction.DELETE,
      entity: AuditEntity.POST,
      entityId: id,
      changes: { slugAr: row.slugAr, slugEn: row.slugEn },
    });
  });
  await publishChanges(changedTags(id));
}
