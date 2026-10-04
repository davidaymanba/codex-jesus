import { ERROR_CODES } from '@codex/shared/constants';

const API_PREFIX = '/api/v1';
const TIMEOUT_MS = 15_000;
const DEFAULT_RETRY_AFTER_SECONDS = 60;

export interface FieldIssue {
  path: string;
  message: string;
}

export type SubmitResult =
  | { kind: 'success' }
  | { kind: 'invalid'; issues: FieldIssue[] }
  | { kind: 'rate-limited'; retryAfterSeconds: number }
  | { kind: 'bot-check-failed' }
  | { kind: 'failed' };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** `error.code` and `error.details` of an API error body, read without a schema library. */
function readError(body: unknown): { code?: unknown; issues: FieldIssue[] } {
  const error = isRecord(body) && isRecord(body.error) ? body.error : {};
  const details = Array.isArray(error.details) ? error.details : [];
  const issues = details.flatMap((detail) =>
    isRecord(detail) && typeof detail.path === 'string' && typeof detail.message === 'string'
      ? [{ path: detail.path, message: detail.message }]
      : [],
  );
  return { code: error.code, issues };
}

const retryAfterOf = (response: Response) => {
  const seconds = Number(response.headers.get('Retry-After'));
  return Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_RETRY_AFTER_SECONDS;
};

/**
 * Posts a public form from the browser straight to the API (no cookies) and maps the answer
 * to what the form shows. Never throws: network failures and timeouts are `failed`.
 */
export async function submitForm(
  apiUrl: string,
  path: '/public/contact' | '/public/quote',
  body: Record<string, unknown>,
): Promise<SubmitResult> {
  let response: Response;
  try {
    response = await fetch(new URL(`${API_PREFIX}${path}`, apiUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      credentials: 'omit',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return { kind: 'failed' };
  }
  if (response.ok) return { kind: 'success' };
  if (response.status === 429)
    return { kind: 'rate-limited', retryAfterSeconds: retryAfterOf(response) };

  const { code, issues } = readError(await response.json().catch(() => null));
  if (code === ERROR_CODES.BOT_CHECK_FAILED) return { kind: 'bot-check-failed' };
  if (code === ERROR_CODES.VALIDATION_FAILED && issues.length > 0)
    return { kind: 'invalid', issues };
  return { kind: 'failed' };
}
