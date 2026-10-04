import type { RequestHandler } from 'express';
import multer, { memoryStorage, MulterError } from 'multer';

import { ERROR_CODES, MEDIA_LIMITS, VALIDATION_MESSAGES as MSG } from '@codex/shared';

import { AppError, ValidationError } from '@/lib/errors.js';

const MAX_TEXT_FIELDS = 4;
const MAX_FIELD_BYTES = 1024;

// Memory storage: the file is checked and re-encoded before it goes anywhere. The limits are
// this route's own body limit (the JSON parser never sees multipart bodies).
const parser = multer({
  storage: memoryStorage(),
  limits: {
    fileSize: MEDIA_LIMITS.MAX_BYTES,
    files: 1,
    fields: MAX_TEXT_FIELDS,
    fieldSize: MAX_FIELD_BYTES,
    parts: MAX_TEXT_FIELDS + 1,
  },
}).single(MEDIA_LIMITS.FILE_FIELD);

/** Parses one image upload; size and shape problems become our usual error responses. */
export const parseUpload: RequestHandler = (req, res, next) => {
  parser(req, res, (error: unknown) => {
    if (error instanceof MulterError) {
      next(
        error.code === 'LIMIT_FILE_SIZE'
          ? new AppError({ statusCode: 413, code: ERROR_CODES.PAYLOAD_TOO_LARGE })
          : new ValidationError([{ path: MEDIA_LIMITS.FILE_FIELD, message: MSG.INVALID_TYPE }]),
      );
      return;
    }
    if (error) {
      next(error);
      return;
    }
    if (!req.file) {
      next(new ValidationError([{ path: MEDIA_LIMITS.FILE_FIELD, message: MSG.FILE_REQUIRED }]));
      return;
    }
    next();
  });
};
