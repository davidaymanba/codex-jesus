import type { ErrorCode } from '@codex/shared';

export type ApiFailureKind = 'http' | 'timeout' | 'network' | 'invalid-response';

/** Any failed API call: the HTTP status and API error code when the API answered. */
export class ApiClientError extends Error {
  readonly kind: ApiFailureKind;
  readonly status: number | undefined;
  readonly code: ErrorCode | undefined;
  readonly path: string;

  constructor({
    kind,
    path,
    status,
    code,
    cause,
  }: {
    kind: ApiFailureKind;
    path: string;
    status?: number;
    code?: ErrorCode;
    cause?: unknown;
  }) {
    super(`API ${kind} failure on ${path}${status === undefined ? '' : ` (${String(status)})`}`, {
      cause,
    });
    this.name = 'ApiClientError';
    this.kind = kind;
    this.path = path;
    this.status = status;
    this.code = code;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}
