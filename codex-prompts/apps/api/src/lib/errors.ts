import { ERROR_CODES, ERROR_MESSAGES, type ErrorCode, type ValidationIssue } from '@codex/shared';

interface AppErrorOptions {
  statusCode: number;
  code: ErrorCode;
  /** i18n key sent to the client; defaults to the code's message. */
  message?: string;
  details?: ValidationIssue[];
  /** false = a bug, not an expected condition: logged at error level with its stack. */
  isOperational?: boolean;
  cause?: unknown;
}

/**
 * Base class for every error the API reports on purpose. The central error handler turns it
 * into the `{ success: false, error }` envelope; anything else becomes a generic 500.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details: ValidationIssue[] | undefined;
  readonly isOperational: boolean;

  constructor({
    statusCode,
    code,
    message,
    details,
    isOperational = true,
    cause,
  }: AppErrorOptions) {
    super(message ?? ERROR_MESSAGES[code], { cause });
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
  }
}

export class ValidationError extends AppError {
  constructor(details: ValidationIssue[] = []) {
    super({ statusCode: 400, code: ERROR_CODES.VALIDATION_FAILED, details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    code:
      | typeof ERROR_CODES.UNAUTHORIZED
      | typeof ERROR_CODES.INVALID_CREDENTIALS = ERROR_CODES.UNAUTHORIZED,
  ) {
    super({ statusCode: 401, code });
  }
}

export class ForbiddenError extends AppError {
  constructor(
    code: typeof ERROR_CODES.FORBIDDEN | typeof ERROR_CODES.CSRF_INVALID = ERROR_CODES.FORBIDDEN,
  ) {
    super({ statusCode: 403, code });
  }
}

export class NotFoundError extends AppError {
  constructor() {
    super({ statusCode: 404, code: ERROR_CODES.NOT_FOUND });
  }
}

export class ConflictError extends AppError {
  constructor(details?: ValidationIssue[]) {
    super({ statusCode: 409, code: ERROR_CODES.CONFLICT, ...(details && { details }) });
  }
}

/**
 * A refresh lost the race against a concurrent refresh of the same session (two tabs). The
 * session is fine and the winner's cookies are already set: the client retries its request.
 */
export class RefreshConflictError extends AppError {
  constructor() {
    super({ statusCode: 409, code: ERROR_CODES.REFRESH_CONFLICT });
  }
}

export class RateLimitError extends AppError {
  /** Seconds until the client may retry; sent as `Retry-After`. */
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super({ statusCode: 429, code: ERROR_CODES.RATE_LIMITED });
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
