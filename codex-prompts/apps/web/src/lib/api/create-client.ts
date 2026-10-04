import { z } from 'zod';

import {
  apiErrorSchema,
  createApiSuccessSchema,
  INTERNAL_API_HEADER,
  type PaginationMeta,
} from '@codex/shared';

import { ApiClientError } from './errors';

const API_PREFIX = '/api/v1';
const DEFAULT_TIMEOUT_MS = 5_000;
/**
 * Upper bound on staleness if a revalidation webhook is ever missed; normally the API's
 * webhook revalidates the tags within seconds of a write.
 */
export const DEFAULT_REVALIDATE_SECONDS = 3_600;

type QueryValue = string | number | boolean | undefined;

// The envelope first, then `data` with the caller's schema (keeps the result type precise).
const SUCCESS_ENVELOPE = createApiSuccessSchema(z.unknown());

export interface ApiRequest<TSchema extends z.ZodType> {
  /** Path under `/api/v1`, e.g. `/public/settings`. */
  path: string;
  /** Schema of `data`; checked in development so a contract drift fails loudly. */
  schema: TSchema;
  query?: Record<string, QueryValue>;
  /** Cache tags (`CACHE_TAGS` / `entityTag`), revalidated by the API's webhook. */
  tags: readonly string[];
  revalidateSeconds?: number;
  timeoutMs?: number;
}

export interface ApiResult<TData> {
  data: TData;
  meta?: PaginationMeta;
}

interface ClientOptions {
  baseUrl: string;
  /** The web server's token: its own rate-limit bucket on the API. */
  internalToken: string | undefined;
  /** Validate every response against its schema (development and tests). */
  shouldValidate: boolean;
  fetchImpl?: typeof fetch;
}

function urlOf(baseUrl: string, path: string, query: Record<string, QueryValue> = {}): URL {
  const url = new URL(`${API_PREFIX}${path}`, baseUrl);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url;
}

async function readJson(response: Response, path: string): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    throw new ApiClientError({
      kind: 'invalid-response',
      path,
      status: response.status,
      cause: error,
    });
  }
}

function toFetchFailure(error: unknown, path: string): ApiClientError {
  const isTimeout = error instanceof DOMException && error.name === 'TimeoutError';
  return new ApiClientError({ kind: isTimeout ? 'timeout' : 'network', path, cause: error });
}

/**
 * A typed client for the Codex API, for server components only: every call has a timeout,
 * is cached by Next.js under the given tags, and fails with an `ApiClientError`.
 */
export function createApiClient({
  baseUrl,
  internalToken,
  shouldValidate,
  fetchImpl = fetch,
}: ClientOptions) {
  return async function apiFetch<TSchema extends z.ZodType>({
    path,
    schema,
    query,
    tags,
    revalidateSeconds = DEFAULT_REVALIDATE_SECONDS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  }: ApiRequest<TSchema>): Promise<ApiResult<z.output<TSchema>>> {
    let response: Response;
    try {
      response = await fetchImpl(urlOf(baseUrl, path, query), {
        headers: {
          Accept: 'application/json',
          ...(internalToken && { [INTERNAL_API_HEADER]: internalToken }),
        },
        cache: 'force-cache',
        next: { tags: [...tags], revalidate: revalidateSeconds },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      throw toFetchFailure(error, path);
    }

    const body = await readJson(response, path);
    if (!response.ok) {
      const failure = apiErrorSchema.safeParse(body);
      throw new ApiClientError({
        kind: 'http',
        path,
        status: response.status,
        ...(failure.success && { code: failure.data.error.code }),
      });
    }
    if (!shouldValidate) {
      // Production trusts the contract checked in development and CI (shared schemas).
      return body as ApiResult<z.output<TSchema>>;
    }
    const envelope = SUCCESS_ENVELOPE.safeParse(body);
    const data = envelope.success ? schema.safeParse(envelope.data.data) : envelope;
    if (!envelope.success || !data.success) {
      throw new ApiClientError({
        kind: 'invalid-response',
        path,
        status: response.status,
        cause: data.error,
      });
    }
    return { data: data.data, ...(envelope.data.meta && { meta: envelope.data.meta }) };
  };
}

export type ApiFetch = ReturnType<typeof createApiClient>;
