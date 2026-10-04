import type { RichTextDocument } from '@codex/shared';

import { ownerDb } from './database.js';

/** A one-paragraph rich text document. */
export function richText(text: string): RichTextDocument {
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] };
}

export const localized = (ar: string, en: string) => ({ ar, en });

let mediaCounter = 0;

/** A media row (as if uploaded), for cover and relation tests. */
export async function createMedia(publicId = `test/media-${++mediaCounter}`) {
  return ownerDb.media.create({
    data: {
      url: `https://res.cloudinary.com/codex-test/image/upload/${publicId}.jpg`,
      publicId,
      alt: localized('صورة', 'Image'),
      width: 1200,
      height: 800,
      mimeType: 'image/jpeg',
      sizeBytes: 1024,
    },
    select: { id: true, url: true, publicId: true },
  });
}

/** A valid `POST /admin/services` body. */
export function serviceBody(overrides: Record<string, unknown> = {}) {
  return {
    title: localized('تطوير البرمجيات', 'Software Development'),
    shortDescription: localized('نبني منتجات رقمية', 'We build digital products'),
    content: { ar: richText('محتوى'), en: richText('Content') },
    icon: 'code-xml',
    category: 'DEVELOPMENT',
    status: 'PUBLISHED',
    ...overrides,
  };
}

/** A valid `POST /admin/projects` body. */
export function projectBody(overrides: Record<string, unknown> = {}) {
  return {
    title: localized('متجر أزياء', 'Fashion Store'),
    industry: localized('تجزئة', 'Retail'),
    serviceCategory: 'DEVELOPMENT',
    challenge: { ar: richText('التحدي'), en: richText('The challenge') },
    solution: { ar: richText('الحل'), en: richText('The solution') },
    status: 'PUBLISHED',
    ...overrides,
  };
}

/** A category row of the given type. */
export function createCategoryRow(type: 'POST' | 'PROJECT', slugEn: string) {
  return ownerDb.category.create({
    data: { name: localized(slugEn, slugEn), slugAr: `${slugEn}-ar`, slugEn, type },
    select: { id: true, slugEn: true, slugAr: true },
  });
}

/** A valid `POST /admin/posts` body. */
export function postBody(overrides: Record<string, unknown> = {}) {
  return {
    title: localized('الهوية البصرية للعلامات', 'Visual Identity for Brands'),
    excerpt: localized('لماذا تهم الهوية', 'Why identity matters'),
    content: { ar: richText('نص المقال'), en: richText('Article text') },
    status: 'PUBLISHED',
    ...overrides,
  };
}

/** A quote request row, as the public form would store it. */
export function createQuoteRow(overrides: Record<string, unknown> = {}) {
  return ownerDb.quoteRequest.create({
    data: {
      services: ['ECOMMERCE'],
      projectDetails: 'An online store with payments and shipping.',
      budgetRange: 'UNDER_5K',
      timeline: 'ASAP',
      name: 'Lead Person',
      email: 'lead@client.example',
      locale: 'ar',
      ipHash: 'a'.repeat(64),
      ...overrides,
    },
    select: { id: true },
  });
}
