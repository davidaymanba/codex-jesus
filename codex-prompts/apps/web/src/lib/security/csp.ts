/** Request header carrying the per-request nonce from the proxy to server components. */
export const NONCE_HEADER = 'x-nonce';

/** Third-party origins the site needs, and nothing else (CLAUDE.md §8). */
export const CSP_SOURCES = {
  CLOUDINARY: 'https://res.cloudinary.com',
  TURNSTILE: 'https://challenges.cloudflare.com',
  /** The contact page's map iframe, loaded only when the visitor asks for it. */
  GOOGLE_MAPS: 'https://www.google.com',
} as const;

const NONCE_BYTES = 16;

interface CspOptions {
  nonce: string;
  /** Origin the browser posts forms to (NEXT_PUBLIC_API_URL). */
  apiOrigin: string;
  /** Development needs `eval` (React debugging) and a websocket for hot reload. */
  isDevelopment: boolean;
  /** Only an https site may upgrade its requests (a local http build would break). */
  isHttpsSite: boolean;
}

/** A fresh, unguessable nonce for one response. */
export function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
  return btoa(String.fromCharCode(...bytes));
}

/**
 * The Content-Security-Policy for HTML responses. Scripts run only with this response's nonce
 * (`strict-dynamic` lets them load their own chunks). Styles allow inline: Radix and next/image
 * write `style` attributes and sonner injects a `<style>` element at runtime; scripts, the
 * real XSS vector, stay nonce-only.
 */
export function buildCsp({ nonce, apiOrigin, isDevelopment, isHttpsSite }: CspOptions): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDevelopment ? ["'unsafe-eval'"] : []),
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', CSP_SOURCES.CLOUDINARY],
    'font-src': ["'self'"],
    'connect-src': ["'self'", apiOrigin, CSP_SOURCES.TURNSTILE, ...(isDevelopment ? ['ws:'] : [])],
    'frame-src': [CSP_SOURCES.TURNSTILE, CSP_SOURCES.GOOGLE_MAPS],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };
  const policy = Object.entries(directives).map(
    ([name, sources]) => `${name} ${[...new Set(sources)].join(' ')}`,
  );
  if (isHttpsSite) policy.push('upgrade-insecure-requests');
  return policy.join('; ');
}
