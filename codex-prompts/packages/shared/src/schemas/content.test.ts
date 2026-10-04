import { describe, expect, it } from 'vitest';

import { createPostSchema, postQuerySchema, updatePostSchema } from './post.js';
import { createProjectSchema, updateProjectSchema } from './project.js';
import { createServiceSchema, updateServiceSchema } from './service.js';
import { createCategorySchema, createTagSchema } from './taxonomy.js';
import { VALIDATION_MESSAGES as MSG } from '../constants/validation-messages.js';
import { ContentStatus } from '../enums/content-status.js';
import { ID, localized, localizedRichText } from '../test/fixtures.js';
import { issueMessages, issuesByPath } from '../test/issues.js';

const validService = {
  title: localized('تطوير البرمجيات', 'Software Development'),
  shortDescription: localized('نبني منتجات رقمية', 'We build digital products'),
  content: localizedRichText,
  icon: 'code-xml',
  category: 'DEVELOPMENT',
};

const validProject = {
  title: localized('متجر أزياء', 'Fashion store'),
  industry: localized('تجزئة', 'Retail'),
  serviceCategory: 'DEVELOPMENT',
  challenge: localizedRichText,
  solution: localizedRichText,
};

const validPost = {
  title: localized('عنوان', 'Title'),
  excerpt: localized('مقتطف', 'Excerpt'),
  content: localizedRichText,
};

describe('create schemas', () => {
  it('apply defaults for omitted optional fields', () => {
    expect(createServiceSchema.parse(validService)).toMatchObject({
      status: ContentStatus.DRAFT,
      order: 0,
      subServices: [],
      benefits: [],
      faqs: [],
    });
    expect(createProjectSchema.parse(validProject)).toMatchObject({
      status: ContentStatus.DRAFT,
      isFeatured: false,
      galleryIds: [],
      techStack: [],
    });
    expect(createPostSchema.parse(validPost)).toMatchObject({ isFeatured: false, tagIds: [] });
  });

  it('strip unknown fields (mass-assignment protection)', () => {
    const parsed = createPostSchema.parse({ ...validPost, authorId: ID, readingTimeAr: 99 });

    expect(parsed).not.toHaveProperty('authorId');
    expect(parsed).not.toHaveProperty('readingTimeAr');
  });

  it('report every invalid field with an i18n key', () => {
    const issues = issuesByPath(createServiceSchema, {
      ...validService,
      icon: 'skull',
      slugEn: 'Not A Slug',
      title: { ar: 'عنوان' },
    });

    expect(issues).toEqual({
      icon: MSG.INVALID_OPTION,
      slugEn: MSG.INVALID_SLUG,
      'title.en': MSG.REQUIRED,
    });
  });

  it('reject rich text that is not a valid document', () => {
    const issues = issuesByPath(createPostSchema, {
      ...validPost,
      content: { ...localizedRichText, en: { type: 'doc', content: [{ type: 'script' }] } },
    });

    expect(issues).toEqual({ 'content.en.content.0.type': MSG.RICH_TEXT_INVALID });
  });

  it('reject duplicate relation ids and tech stack entries', () => {
    expect(issueMessages(createProjectSchema, { ...validProject, categoryIds: [ID, ID] })).toEqual([
      MSG.DUPLICATE_ITEMS,
    ]);
    expect(
      issueMessages(createProjectSchema, { ...validProject, techStack: ['Next.js', 'Next.js'] }),
    ).toEqual([MSG.DUPLICATE_ITEMS]);
  });
});

describe('update schemas', () => {
  it('accept partial payloads without injecting defaults', () => {
    expect(updateServiceSchema.parse({ order: 3 })).toEqual({ order: 3 });
    expect(updateProjectSchema.parse({})).toEqual({});
    expect(updatePostSchema.parse({ status: 'PUBLISHED' })).toEqual({ status: 'PUBLISHED' });
  });

  it('allow clearing nullable references', () => {
    expect(updatePostSchema.parse({ coverId: null, seo: null })).toEqual({
      coverId: null,
      seo: null,
    });
  });
});

describe('query schemas', () => {
  it('coerce filters and apply sort defaults', () => {
    expect(
      postQuerySchema.parse({ page: '2', isFeatured: 'false', tag: 'سلة', q: ' shopify ' }),
    ).toEqual({
      page: 2,
      pageSize: 12,
      isFeatured: false,
      tag: 'سلة',
      q: 'shopify',
      sortBy: 'publishedAt',
      sortOrder: 'desc',
    });
  });

  it('reject one-character search terms', () => {
    expect(issueMessages(postQuerySchema, { q: ' a ' })).toEqual([MSG.TOO_SHORT]);
  });
});

describe('taxonomy schemas', () => {
  it('require a type for categories only', () => {
    expect(issuesByPath(createCategorySchema, { name: localized('تطوير', 'Development') })).toEqual(
      {
        type: MSG.INVALID_OPTION,
      },
    );
    expect(createTagSchema.parse({ name: localized('سلة', 'Salla'), slugEn: 'salla' })).toEqual({
      name: { ar: 'سلة', en: 'Salla' },
      slugEn: 'salla',
    });
  });
});
