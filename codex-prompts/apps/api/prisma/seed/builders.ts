import { createHash } from 'node:crypto';

import {
  BRAND_COLORS,
  slugArSchema,
  slugEnSchema,
  type LocalizedString,
  type RichTextDocument,
  type RichTextNode,
} from '@codex/shared';

import type { Prisma } from '@/generated/prisma/client.js';

const UUID_VERSION_8 = '8';
const UUID_VARIANT_BITS = 0b1000;

/**
 * Deterministic UUID (RFC 9562 v8) from a seed key, so every run targets the same rows
 * and relations can reference records before they exist.
 */
export function seedId(key: string): string {
  const hex = createHash('sha256').update(`codex-seed:${key}`).digest('hex');
  const variant = ((Number.parseInt(hex.charAt(16), 16) & 0b0011) | UUID_VARIANT_BITS).toString(16);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `${UUID_VERSION_8}${hex.slice(13, 16)}`,
    `${variant}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join('-');
}

export const l = (ar: string, en: string): LocalizedString => ({ ar, en });

const text = (value: string): RichTextNode => ({ type: 'text', text: value });

export const paragraph = (value: string): RichTextNode => ({
  type: 'paragraph',
  content: [text(value)],
});

export const heading = (value: string): RichTextNode => ({
  type: 'heading',
  attrs: { level: 2 },
  content: [text(value)],
});

export const bulletList = (...items: string[]): RichTextNode => ({
  type: 'bulletList',
  content: items.map((item) => ({ type: 'listItem', content: [paragraph(item)] })),
});

export const doc = (...content: RichTextNode[]): RichTextDocument => ({ type: 'doc', content });

/**
 * PLACEHOLDER image URL (placehold.co, brand colors). Replace every `placeholder/*` media
 * record with real Cloudinary uploads before launch.
 */
export function placeholderImageUrl(width: number, height: number, label: string): string {
  const background = BRAND_COLORS.navy950.slice(1);
  const foreground = BRAND_COLORS.lavender50.slice(1);
  return `https://placehold.co/${width}x${height}/${background}/${foreground}/png?text=${encodeURIComponent(label)}`;
}

/**
 * Converts zod-validated seed values (plain JSON by construction) to Prisma's JSON input type.
 * The round trip drops `undefined` keys, which JSON columns cannot store; zod's optional keys
 * (`key?: T | undefined`) are why a plain assignment fails under `exactOptionalPropertyTypes`.
 */
export function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * Seed records always carry both slugs (the API derives them only for admin input), so seed
 * parsing extends the create schemas with required slugs.
 */
export const SEED_SLUG_FIELDS = { slugAr: slugArSchema, slugEn: slugEnSchema };
