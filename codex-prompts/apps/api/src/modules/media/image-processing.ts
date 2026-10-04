import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';

import {
  MEDIA_LIMITS,
  MEDIA_MIME_TYPES,
  VALIDATION_MESSAGES as MSG,
  type MediaMimeType,
} from '@codex/shared';

import { ValidationError } from '@/lib/errors.js';

export interface ProcessedImage {
  data: Buffer;
  mimeType: MediaMimeType;
  width: number;
  height: number;
}

const FORMAT_OF: Record<MediaMimeType, 'jpeg' | 'png' | 'webp' | 'avif'> = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

const isAllowedType = (mime: string | undefined): mime is MediaMimeType =>
  (MEDIA_MIME_TYPES as readonly (string | undefined)[]).includes(mime);

const fileIssue = (message: string) => new ValidationError([{ path: 'file', message }]);

/**
 * Trusts nothing the client says about the file: the type comes from its magic bytes (an
 * HTML file renamed .png is refused, and so is SVG, which can carry scripts). The image is
 * decoded and re-encoded, which applies the EXIF orientation and drops every metadata block
 * (GPS, camera, author), and its real dimensions are measured.
 */
export async function processImage(upload: Buffer): Promise<ProcessedImage> {
  const detected = await fileTypeFromBuffer(upload);
  if (!isAllowedType(detected?.mime)) throw fileIssue(MSG.UNSUPPORTED_FILE_TYPE);
  const mimeType = detected.mime;

  try {
    const { data, info } = await sharp(upload, {
      failOn: 'error',
      limitInputPixels: MEDIA_LIMITS.MAX_DIMENSION_PX * MEDIA_LIMITS.MAX_DIMENSION_PX,
    })
      .rotate()
      .toFormat(FORMAT_OF[mimeType])
      .toBuffer({ resolveWithObject: true });
    if (info.width > MEDIA_LIMITS.MAX_DIMENSION_PX || info.height > MEDIA_LIMITS.MAX_DIMENSION_PX) {
      throw fileIssue(MSG.INVALID_IMAGE);
    }
    return { data, mimeType, width: info.width, height: info.height };
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    // Corrupt or truncated images, decompression bombs: the client's file, not our bug.
    throw fileIssue(MSG.INVALID_IMAGE);
  }
}
