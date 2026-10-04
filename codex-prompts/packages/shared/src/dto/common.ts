import { z } from 'zod';

import { socialPlatformSchema } from '../enums/social-platform.js';

/**
 * Response (DTO) schemas describe what the API returns. They are plain zod objects without
 * transforms or i18n messages: they document responses in OpenAPI and let the web client
 * validate what it receives in development.
 */
export const localizedTextDtoSchema = z.object({ ar: z.string(), en: z.string() });

/** A stored, sanitized Tiptap document (validated on save by `richTextDocumentSchema`). */
export const richTextDtoSchema = z.object({
  type: z.literal('doc'),
  content: z.array(z.record(z.string(), z.unknown())),
});

export const localizedRichTextDtoSchema = z.object({
  ar: richTextDtoSchema,
  en: richTextDtoSchema,
});

export const timestampDtoSchema = z.iso.datetime({ offset: true });

export const seoDtoSchema = z
  .object({
    metaTitle: localizedTextDtoSchema.optional(),
    metaDescription: localizedTextDtoSchema.optional(),
  })
  .nullable();

/** An image as the site renders it (`next/image` needs the dimensions). */
export const mediaDtoSchema = z.object({
  id: z.uuid(),
  url: z.url(),
  alt: localizedTextDtoSchema,
  width: z.int(),
  height: z.int(),
});

export const socialLinkDtoSchema = z.object({ platform: socialPlatformSchema, url: z.url() });

/** Both locale slugs, so the language switcher can link to the same page. */
export const slugsDtoSchema = z.object({ slugAr: z.string(), slugEn: z.string() });

/** `201` body of the public forms: nothing about what was stored. */
export const formReceiptDtoSchema = z.object({ received: z.literal(true) });

/** Result of a reorder request. */
export const reorderResultDtoSchema = z.object({ updated: z.int() });

export type LocalizedTextDto = z.infer<typeof localizedTextDtoSchema>;
export type RichTextDto = z.infer<typeof richTextDtoSchema>;
export type SeoDto = z.infer<typeof seoDtoSchema>;
export type MediaDto = z.infer<typeof mediaDtoSchema>;
export type SocialLinkDto = z.infer<typeof socialLinkDtoSchema>;
export type FormReceiptDto = z.infer<typeof formReceiptDtoSchema>;
