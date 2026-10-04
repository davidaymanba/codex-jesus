import { NextRequest, type NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { clientEnv } from '@/env/client';
import { routing } from '@/lib/i18n/routing';
import { buildCsp, createNonce, NONCE_HEADER } from '@/lib/security/csp';

const handleLocaleRouting = createMiddleware(routing);
const apiOrigin = new URL(clientEnv.NEXT_PUBLIC_API_URL).origin;
const isDevelopment = process.env.NODE_ENV === 'development';
const isHttpsSite = new URL(clientEnv.NEXT_PUBLIC_SITE_URL).protocol === 'https:';

/**
 * Every page request: locale routing (next-intl) and a nonce-based CSP. Next.js reads the
 * nonce from the request's CSP header and stamps it on its own scripts, so the policy is set
 * on the forwarded request as well as on the response. Static headers live in next.config.
 */
export function proxy(request: NextRequest): NextResponse {
  const nonce = createNonce();
  const csp = buildCsp({ nonce, apiOrigin, isDevelopment, isHttpsSite });
  const headers = new Headers(request.headers);
  headers.set('Content-Security-Policy', csp);
  headers.set(NONCE_HEADER, nonce);

  const response = handleLocaleRouting(new NextRequest(request, { headers }));
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  // Pages only: not API routes, Next.js internals, public folders (brand/, fonts/) or root
  // files (robots.txt, icon.svg…). Dots deeper in a path stay matched: `/en/blog/rss.xml` and
  // slugs need the proxy.
  matcher: ['/((?!api(?:/|$)|_next/|_vercel/|brand/|fonts/|[^/]*\\.[^/]*$).*)'],
};
