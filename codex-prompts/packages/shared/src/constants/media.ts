/** Image types accepted for uploads (no SVG: it can carry scripts). */
export const MEDIA_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;

export type MediaMimeType = (typeof MEDIA_MIME_TYPES)[number];

export const MEDIA_LIMITS = {
  /** docs/phases/03-backend-modules.md §5. */
  MAX_BYTES: 5 * 1024 * 1024,
  MAX_DIMENSION_PX: 10_000,
  PUBLIC_ID_MAX: 255,
  /** Multipart field holding the image. */
  FILE_FIELD: 'file',
  /** Seeded placeholder media live under this public id prefix, never on Cloudinary. */
  PLACEHOLDER_PREFIX: 'placeholder/',
} as const;
