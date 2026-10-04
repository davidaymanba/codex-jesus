import { z } from 'zod';

import { REVALIDATION, verifyRevalidation } from '@codex/shared';

/** Largest body worth reading: MAX_TAGS tags of TAG_MAX_LENGTH, plus JSON punctuation. */
const MAX_BODY_BYTES = REVALIDATION.MAX_TAGS * (REVALIDATION.TAG_MAX_LENGTH + 4) + 32;

const bodySchema = z.strictObject({
  tags: z
    .array(z.string().min(1).max(REVALIDATION.TAG_MAX_LENGTH))
    .min(1)
    .max(REVALIDATION.MAX_TAGS),
});

interface Dependencies {
  /** REVALIDATE_SECRET; unset means the webhook is disabled. */
  secret: string | undefined;
  revalidate: (tag: string) => void;
  now?: Date;
}

// Minimal bodies: nothing that helps a caller probe the endpoint.
const reply = (status: number, body: object = {}) => Response.json(body, { status });

/**
 * The body as text, or `undefined` once it grows past `maxBytes`. Reads the stream itself:
 * a chunked request has no Content-Length, and `request.text()` would buffer all of it.
 */
async function readBodyWithLimit(request: Request, maxBytes: number): Promise<string | undefined> {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return undefined;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

function parseTags(body: string): string[] | undefined {
  try {
    const parsed = bodySchema.safeParse(JSON.parse(body));
    return parsed.success ? [...new Set(parsed.data.tags)] : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The API's revalidation webhook (docs/phases/03 §8): checks the HMAC signature over the raw
 * body and timestamp (constant-time, at most 5 minutes old), then revalidates each tag.
 */
export async function handleRevalidation(
  request: Request,
  { secret, revalidate, now = new Date() }: Dependencies,
): Promise<Response> {
  if (!secret) return reply(503);
  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_BODY_BYTES) return reply(413);
  const body = await readBodyWithLimit(request, MAX_BODY_BYTES);
  if (body === undefined) return reply(413);

  const isAuthentic = await verifyRevalidation({
    secret,
    timestamp: request.headers.get(REVALIDATION.TIMESTAMP_HEADER),
    signature: request.headers.get(REVALIDATION.SIGNATURE_HEADER),
    body,
    now,
  });
  if (!isAuthentic) return reply(401);

  const tags = parseTags(body);
  if (!tags) return reply(400);
  for (const tag of tags) revalidate(tag);
  return reply(200, { revalidated: tags.length });
}
