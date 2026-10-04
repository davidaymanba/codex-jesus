import {
  adminMediaDtoSchema,
  AuditAction,
  AuditEntity,
  CACHE_TAGS,
  ERROR_CODES,
  ERROR_MESSAGES,
  localizedTextDtoSchema,
  MEDIA_LIMITS,
  type AdminMediaDto,
  type MediaQuery,
  type MediaUploadFields,
  type MediaUsageDto,
  type PaginationMeta,
  type UpdateMediaInput,
} from '@codex/shared';

import { withTransaction } from '@/lib/base-repository.js';
import { AppError, NotFoundError } from '@/lib/errors.js';
import { logger } from '@/lib/logger.js';
import { mediaStorage, type MediaStorage, type StoredImage } from '@/lib/media-storage.js';
import type { Actor } from '@/modules/auth/actor.js';
import { auditWrite, diffOf } from '@/modules/content/audit.js';
import { parseJson } from '@/modules/content/json.js';
import { publishChanges } from '@/modules/content/publish-changes.js';
import { paginate } from '@/utils/pagination.js';

import { processImage, type ProcessedImage } from './image-processing.js';
import { MediaRepository, type MediaRow } from './media.repository.js';

const media = new MediaRepository();

function toAdminMediaDto(row: MediaRow): AdminMediaDto {
  return {
    ...row,
    alt: parseJson(localizedTextDtoSchema, row.alt),
    mimeType: adminMediaDtoSchema.shape.mimeType.parse(row.mimeType),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listMedia(
  query: MediaQuery,
): Promise<{ items: AdminMediaDto[]; meta: PaginationMeta }> {
  const page = paginate(query);
  const { rows, total } = await media.list(query, page);
  return { items: rows.map(toAdminMediaDto), meta: page.toMeta(total) };
}

async function findOrFail(id: string, repository = media): Promise<MediaRow> {
  const row = await repository.findById(id);
  if (!row) throw new NotFoundError();
  return row;
}

export async function getMedia(id: string): Promise<AdminMediaDto> {
  return toAdminMediaDto(await findOrFail(id));
}

export async function getMediaUsage(id: string): Promise<MediaUsageDto[]> {
  const row = await findOrFail(id);
  return media.findUsages(row.id, row.url);
}

/** Removes a stored file; a failure only leaves an orphaned file to clean up, so it is logged. */
async function destroyStoredFile(storage: MediaStorage, publicId: string): Promise<void> {
  await storage.destroy(publicId).catch((error: unknown) => {
    logger.error({ err: error, publicId }, 'Cloudinary delete failed');
  });
}

function recordUpload(
  stored: StoredImage,
  image: ProcessedImage,
  { altAr, altEn }: MediaUploadFields,
  actor: Actor,
): Promise<AdminMediaDto> {
  return withTransaction(async (tx) => {
    const row = await new MediaRepository(tx).create({
      ...stored,
      alt: { ar: altAr, en: altEn },
      width: image.width,
      height: image.height,
      mimeType: image.mimeType,
      sizeBytes: image.data.length,
      uploadedById: actor.userId,
    });
    await auditWrite(tx, actor, {
      action: AuditAction.CREATE,
      entity: AuditEntity.MEDIA,
      entityId: row.id,
      changes: { publicId: row.publicId, mimeType: row.mimeType, sizeBytes: row.sizeBytes },
    });
    return toAdminMediaDto(row);
  });
}

/** Validates, cleans (EXIF stripped) and stores an image, then records it. */
export async function uploadMedia(
  file: Buffer,
  fields: MediaUploadFields,
  actor: Actor,
): Promise<AdminMediaDto> {
  if (!mediaStorage) {
    throw new AppError({ statusCode: 503, code: ERROR_CODES.SERVICE_UNAVAILABLE });
  }
  const image = await processImage(file);
  const stored = await mediaStorage.upload(image.data);
  try {
    return await recordUpload(stored, image, fields, actor);
  } catch (error) {
    // Nothing can reference the file yet: remove it instead of leaving an orphan behind.
    await destroyStoredFile(mediaStorage, stored.publicId);
    throw error;
  }
}

export async function updateMedia(
  id: string,
  input: UpdateMediaInput,
  actor: Actor,
): Promise<AdminMediaDto> {
  const before = toAdminMediaDto(await findOrFail(id));
  const updated = await withTransaction(async (tx) => {
    const after = toAdminMediaDto(await new MediaRepository(tx).update(id, input));
    await auditWrite(tx, actor, {
      action: AuditAction.UPDATE,
      entity: AuditEntity.MEDIA,
      entityId: id,
      changes: diffOf(before, after),
    });
    return after;
  });
  // Alt text is embedded in public DTOs.
  await publishChanges([CACHE_TAGS.MEDIA]);
  return updated;
}

function mediaInUse(usages: MediaUsageDto[]): AppError {
  return new AppError({
    statusCode: 409,
    code: ERROR_CODES.MEDIA_IN_USE,
    details: usages.map(({ entity, id, field }) => ({
      path: `${entity}.${id}.${field}`,
      message: ERROR_MESSAGES.MEDIA_IN_USE,
    })),
  });
}

/**
 * Deletes unused media: refused (409, listing every use) while anything references it. The
 * file is removed from Cloudinary after the row is gone; seeded placeholders never were there.
 */
export async function deleteMedia(id: string, actor: Actor): Promise<void> {
  const row = await withTransaction(async (tx) => {
    const repository = new MediaRepository(tx);
    const found = await findOrFail(id, repository);
    const usages = await repository.findUsages(found.id, found.url);
    if (usages.length > 0) throw mediaInUse(usages);
    await repository.delete(id);
    await auditWrite(tx, actor, {
      action: AuditAction.DELETE,
      entity: AuditEntity.MEDIA,
      entityId: id,
      changes: { publicId: found.publicId },
    });
    return found;
  });
  await publishChanges([CACHE_TAGS.MEDIA]);
  if (!mediaStorage || row.publicId.startsWith(MEDIA_LIMITS.PLACEHOLDER_PREFIX)) return;
  // The record is already gone, so the file goes last.
  await destroyStoredFile(mediaStorage, row.publicId);
}
