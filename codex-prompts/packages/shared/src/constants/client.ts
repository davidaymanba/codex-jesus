/**
 * The constants without zod, for browser bundles (`@codex/shared/constants`). zod builds its
 * object schemas at import time and probes `new Function` while doing so, which a strict CSP
 * reports as a violation (and it adds ~60 KB). Client components import from here; everything
 * else uses the package root. `permissions` is left out: it pulls in the Role schema.
 */
export * from './auth.js';
export * from './brand.js';
export * from './cache-tags.js';
export * from './error-codes.js';
export * from './field-limits.js';
export * from './forms.js';
export * from './locales.js';
export * from './media.js';
export * from './pagination.js';
export * from './reading-time.js';
export * from './revalidation.js';
export * from './rich-text.js';
export * from './service-icons.js';
export * from './validation-messages.js';
