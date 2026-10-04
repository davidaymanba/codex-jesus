import {
  calculateReadingTime,
  createCategorySchema,
  createMediaSchema,
  createPostSchema,
  createProjectSchema,
  createServiceSchema,
  createTagSchema,
} from '@codex/shared';

import type { PrismaClient } from '@/generated/prisma/client.js';

import { SEED_SLUG_FIELDS, toJson } from './builders.js';
import { MEDIA } from './data/media.js';
import { POSTS } from './data/posts.js';
import { PROJECTS } from './data/projects.js';
import { SERVICES } from './data/services/index.js';
import { CATEGORIES, TAGS } from './data/taxonomy.js';

// Every upsert uses `update: {}`: re-running the seed creates what is missing and never
// overwrites edits made in the admin dashboard.

const toDate = (value: string | null | undefined): Date | null => (value ? new Date(value) : null);

export async function seedMedia(db: PrismaClient): Promise<void> {
  for (const { id, ...record } of MEDIA) {
    const media = createMediaSchema.parse(record);
    await db.media.upsert({
      where: { id },
      create: { id, ...media, alt: toJson(media.alt) },
      update: {},
    });
  }
}

export async function seedServices(db: PrismaClient): Promise<void> {
  for (const { id, ...record } of SERVICES) {
    const service = createServiceSchema.extend(SEED_SLUG_FIELDS).parse(record);
    await db.service.upsert({
      where: { id },
      create: {
        id,
        slugAr: service.slugAr,
        slugEn: service.slugEn,
        title: toJson(service.title),
        shortDescription: toJson(service.shortDescription),
        content: toJson(service.content),
        icon: service.icon,
        category: service.category,
        subServices: toJson(service.subServices),
        benefits: toJson(service.benefits),
        faqs: toJson(service.faqs),
        coverId: service.coverId ?? null,
        ogImageId: service.ogImageId ?? null,
        order: service.order,
        status: service.status,
      },
      update: {},
    });
  }
}

export async function seedTaxonomy(db: PrismaClient): Promise<void> {
  for (const { id, ...record } of CATEGORIES) {
    const category = createCategorySchema.extend(SEED_SLUG_FIELDS).parse(record);
    await db.category.upsert({
      where: { id },
      create: { id, ...category, name: toJson(category.name) },
      update: {},
    });
  }
  for (const { id, ...record } of TAGS) {
    const tag = createTagSchema.extend(SEED_SLUG_FIELDS).parse(record);
    await db.tag.upsert({
      where: { id },
      create: { id, ...tag, name: toJson(tag.name) },
      update: {},
    });
  }
}

export async function seedProjects(db: PrismaClient): Promise<void> {
  for (const { id, ...record } of PROJECTS) {
    const project = createProjectSchema.extend(SEED_SLUG_FIELDS).parse(record);
    await db.project.upsert({
      where: { id },
      create: {
        id,
        slugAr: project.slugAr,
        slugEn: project.slugEn,
        title: toJson(project.title),
        client: project.client ?? null,
        industry: toJson(project.industry),
        serviceCategory: project.serviceCategory,
        coverId: project.coverId ?? null,
        ogImageId: project.ogImageId ?? null,
        challenge: toJson(project.challenge),
        solution: toJson(project.solution),
        results: toJson(project.results),
        techStack: project.techStack,
        isFeatured: project.isFeatured,
        status: project.status,
        publishedAt: toDate(project.publishedAt),
        order: project.order,
        categories: { connect: project.categoryIds.map((categoryId) => ({ id: categoryId })) },
        gallery: { create: project.galleryIds.map((mediaId, order) => ({ mediaId, order })) },
      },
      update: {},
    });
  }
}

export async function seedPosts(db: PrismaClient, authorId: string): Promise<void> {
  for (const { id, ...record } of POSTS) {
    const post = createPostSchema.extend(SEED_SLUG_FIELDS).parse(record);
    await db.post.upsert({
      where: { id },
      create: {
        id,
        slugAr: post.slugAr,
        slugEn: post.slugEn,
        title: toJson(post.title),
        excerpt: toJson(post.excerpt),
        content: toJson(post.content),
        coverId: post.coverId ?? null,
        ogImageId: post.ogImageId ?? null,
        authorId,
        readingTimeAr: calculateReadingTime(post.content.ar, 'ar'),
        readingTimeEn: calculateReadingTime(post.content.en, 'en'),
        isFeatured: post.isFeatured,
        status: post.status,
        publishedAt: toDate(post.publishedAt),
        categories: { connect: post.categoryIds.map((categoryId) => ({ id: categoryId })) },
        tags: { connect: post.tagIds.map((tagId) => ({ id: tagId })) },
      },
      update: {},
    });
  }
}
