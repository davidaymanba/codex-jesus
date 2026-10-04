/**
 * Machine-readable error codes returned in `error.code`. Clients branch on the code; the
 * matching `error.message` is an i18n key (see `ERROR_MESSAGES`).
 */
export const ERROR_CODES = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_JSON: 'INVALID_JSON',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  FORBIDDEN: 'FORBIDDEN',
  CSRF_INVALID: 'CSRF_INVALID',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  /** Delete refused: `details` lists every `<entity>.<id>.<field>` still using the media. */
  MEDIA_IN_USE: 'MEDIA_IN_USE',
  /** Another tab refreshed the session first; retry the original request (cookies are fresh). */
  REFRESH_CONFLICT: 'REFRESH_CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  /** The bot check (Turnstile) failed or expired: the form should get a fresh token. */
  BOT_CHECK_FAILED: 'BOT_CHECK_FAILED',
  INTERNAL: 'INTERNAL',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** Default i18n key per error code; the frontend translates it. */
export const ERROR_MESSAGES = {
  VALIDATION_FAILED: 'errors.validationFailed',
  INVALID_JSON: 'errors.invalidJson',
  PAYLOAD_TOO_LARGE: 'errors.payloadTooLarge',
  UNAUTHORIZED: 'errors.unauthorized',
  INVALID_CREDENTIALS: 'errors.invalidCredentials',
  FORBIDDEN: 'errors.forbidden',
  CSRF_INVALID: 'errors.csrfInvalid',
  NOT_FOUND: 'errors.notFound',
  CONFLICT: 'errors.conflict',
  MEDIA_IN_USE: 'errors.mediaInUse',
  REFRESH_CONFLICT: 'errors.refreshConflict',
  RATE_LIMITED: 'errors.rateLimited',
  BOT_CHECK_FAILED: 'errors.botCheckFailed',
  INTERNAL: 'errors.internal',
  SERVICE_UNAVAILABLE: 'errors.serviceUnavailable',
} as const satisfies Record<ErrorCode, string>;
