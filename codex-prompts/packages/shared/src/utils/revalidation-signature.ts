import { REVALIDATION } from '../constants/revalidation.js';

const encoder = new TextEncoder();
const HEX_PAIR = /^[0-9a-f]{2}$/;
const MS_PER_SECOND = 1000;

// Inferred: the DOM and Node typings name the key type differently.
function importKey(secret: string, usage: 'sign' | 'verify') {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  );
}

const signedPayload = (timestamp: string, body: string): Uint8Array =>
  encoder.encode(`${timestamp}.${body}`);

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array | undefined {
  if (hex.length === 0 || hex.length % 2 !== 0) return undefined;
  const pairs = hex.match(/.{2}/g) ?? [];
  if (!pairs.every((pair) => HEX_PAIR.test(pair))) return undefined;
  return Uint8Array.from(pairs, (pair) => Number.parseInt(pair, 16));
}

/**
 * Signs a revalidation webhook body: returns the `x-codex-signature` header value
 * (`v1=<hex HMAC-SHA256>` over `"<timestamp>.<body>"`). Web Crypto, so it runs in Node and
 * in the Next.js route alike.
 */
export async function signRevalidation(
  secret: string,
  timestamp: string,
  body: string,
): Promise<string> {
  const key = await importKey(secret, 'sign');
  const signature = await crypto.subtle.sign('HMAC', key, signedPayload(timestamp, body));
  return `${REVALIDATION.SIGNATURE_VERSION}=${toHex(signature)}`;
}

export interface RevalidationRequest {
  secret: string;
  /** Unix seconds, as sent in `x-codex-timestamp`. */
  timestamp: string | null;
  signature: string | null;
  /** The raw request body, exactly as received. */
  body: string;
  now?: Date;
}

/**
 * True when the signature matches and the timestamp is at most `MAX_AGE_SECONDS` old (or
 * ahead). The HMAC comparison is constant-time (`crypto.subtle.verify`).
 */
export async function verifyRevalidation({
  secret,
  timestamp,
  signature,
  body,
  now = new Date(),
}: RevalidationRequest): Promise<boolean> {
  if (!timestamp || !signature || !/^\d{1,12}$/.test(timestamp)) return false;
  const ageSeconds = Math.abs(now.getTime() / MS_PER_SECOND - Number(timestamp));
  if (ageSeconds > REVALIDATION.MAX_AGE_SECONDS) return false;

  const [version, hex = ''] = signature.split('=');
  const bytes = fromHex(hex);
  if (version !== REVALIDATION.SIGNATURE_VERSION || !bytes) return false;
  const key = await importKey(secret, 'verify');
  return crypto.subtle.verify('HMAC', key, bytes, signedPayload(timestamp, body));
}
