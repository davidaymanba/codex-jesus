import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

import { clientEnvSchema, parseEnv, serverEnvSchema } from './src/env/schema';
import { REMOTE_IMAGE_HOSTS } from './src/lib/images';

// Fail fast at `next dev` / `next build` start instead of at first request.
parseEnv(serverEnvSchema, process.env);
parseEnv(clientEnvSchema, process.env);

const HSTS_MAX_AGE_SECONDS = 63_072_000;

/** Headers for every response; the per-request CSP is added by src/proxy.ts. */
const SECURITY_HEADERS = [
  {
    key: 'Strict-Transport-Security',
    value: `max-age=${HSTS_MAX_AGE_SECONDS}; includeSubDomains; preload`,
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: REMOTE_IMAGE_HOSTS.map((hostname) => ({
      protocol: 'https' as const,
      hostname,
      pathname: '/**',
    })),
  },
  headers: () =>
    Promise.resolve([
      { source: '/:path*', headers: SECURITY_HEADERS },
      // Font file names are versioned (`.v1`), so browsers may keep them for a year.
      {
        source: '/fonts/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]),
};

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

export default withNextIntl(nextConfig);
