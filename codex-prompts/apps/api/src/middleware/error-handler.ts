import type { ErrorRequestHandler, RequestHandler } from 'express';
import { z } from 'zod';

import { ERROR_CODES, type ApiError } from '@codex/shared';

import { AppError, NotFoundError, RateLimitError, ValidationError } from '@/lib/errors.js';
import { fromPrismaError } from '@/lib/prisma-errors.js';
import { getRequestId } from '@/middleware/request-id.js';

const MAX_CLIENT_ERROR_STATUS = 499;

/** Errors thrown by Express's body parsers (http-errors with a `type`). */
interface BodyParserError {
  status: number;
  type: string;
}

function isBodyParserError(error: unknown): error is BodyParserError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    typeof error.type === 'string' &&
    'status' in error &&
    typeof error.status === 'number'
  );
}

function fromBodyParserError({ status, type }: BodyParserError): AppError | undefined {
  if (type === 'entity.parse.failed') {
    return new AppError({ statusCode: 400, code: ERROR_CODES.INVALID_JSON });
  }
  if (type === 'entity.too.large') {
    return new AppError({ statusCode: 413, code: ERROR_CODES.PAYLOAD_TOO_LARGE });
  }
  // Unsupported charset or encoding, aborted request…: the client's fault, nothing to fix here.
  return status <= MAX_CLIENT_ERROR_STATUS ? new ValidationError() : undefined;
}

/** Normalizes anything thrown in a request to an AppError; unknown errors become a 500. */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof z.ZodError) {
    return new ValidationError(
      error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    );
  }
  const known =
    fromPrismaError(error) ?? (isBodyParserError(error) ? fromBodyParserError(error) : undefined);
  return (
    known ??
    new AppError({
      statusCode: 500,
      code: ERROR_CODES.INTERNAL,
      isOperational: false,
      cause: error,
    })
  );
}

/** Runs after every router: nothing matched, so the route does not exist. */
export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new NotFoundError());
};

/**
 * Central error handler. The body never contains stack traces or internal messages (only
 * i18n keys), in every environment. Unexpected errors are attached to `res.err`, so pino-http
 * logs them once, with the stack, on the response log line.
 */
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (res.headersSent) {
    // A stream failed midway (e.g. a CSV export whose client left): the status is already
    // out, so cut the connection. Express's fallback would print the stack to stderr instead.
    res.err = error instanceof Error ? error : toAppError(error);
    res.destroy();
    return;
  }
  const appError = toAppError(error);

  if (!appError.isOperational) res.err = error instanceof Error ? error : appError;
  if (appError instanceof RateLimitError) {
    res.setHeader('Retry-After', String(appError.retryAfterSeconds));
  }

  const body: ApiError = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details && appError.details.length > 0 && { details: appError.details }),
      requestId: getRequestId(req),
    },
  };
  res.status(appError.statusCode).json(body);
};
