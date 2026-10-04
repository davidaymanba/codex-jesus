export const API_PREFIX = '/api/v1';

/** Route groups under API_PREFIX: unauthenticated reads/forms, and the RBAC-guarded admin. */
export const PUBLIC_PATH = '/public';
export const ADMIN_PATH = '/admin';

/** Swagger UI (`/api/docs`) and the raw document (`/api/docs/openapi.json`). */
export const DOCS_PATH = '/api/docs';

/** Infrastructure probes live outside the versioned API (liveness `/health`, readiness `/health/ready`). */
export const HEALTH_PATH = '/health';

/** Max time to wait for in-flight requests before forcing exit on shutdown. */
export const SHUTDOWN_TIMEOUT_MS = 10_000;

/** Keys whose values never reach the logs, wherever they appear (see `lib/logger.ts`). */
export const SENSITIVE_LOG_KEYS = [
  'password',
  'passwordHash',
  'token',
  'tokenHash',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'authorization',
  'cookie',
  'set-cookie',
  'x-csrf-token',
  'csrfToken',
] as const;

/**
 * PII keys that are masked (not removed) in logs, so an entry stays useful for support
 * (`s***@codex.co`, `***67`) without exposing the full value (CLAUDE.md §8).
 */
export const MASKED_LOG_KEYS = ['email', 'phone'] as const;

/** Object depth covered by log redaction; pino wildcards match exactly one level each. */
export const LOG_REDACT_DEPTH = 3;

/** argon2id cost parameters (OWASP Password Storage Cheat Sheet minimum: 19 MiB, t=2, p=1). */
export const PASSWORD_HASH_COST = {
  MEMORY_KIB: 19_456,
  TIME: 2,
  PARALLELISM: 1,
} as const;

/**
 * Minimum zxcvbn score (0–4) for new passwords. 4 means "very unguessable" (≥10^10 guesses);
 * a stricter bar than usual is fine for the handful of admin accounts.
 */
export const PASSWORD_MIN_STRENGTH_SCORE = 4;

/** Letters a password must keep once the user's context words are removed from it. */
export const PASSWORD_MIN_OWN_LETTERS = 4;

/** Words any Codex password is likely to be built from; counted as guessable context. */
export const PASSWORD_CONTEXT_WORDS = ['codex', 'admin'] as const;

/** Redis client timeouts: fail fast so a slow or down Redis never stalls a request. */
export const REDIS_TIMEOUTS = {
  CONNECT_MS: 2_000,
  COMMAND_MS: 500,
  RECONNECT_BASE_MS: 100,
  RECONNECT_MAX_MS: 5_000,
} as const;

/** Posts shown under an article ("related posts"). */
export const RELATED_POSTS_LIMIT = 3;

/** Public GET responses stay in Redis this long unless a write invalidates them first. */
export const PUBLIC_CACHE_TTL_SECONDS = 60 * 60;

/** Namespace (and version: bump to orphan every entry after a format change) for cache keys. */
export const CACHE_KEY_PREFIX = 'cache:v1';

/**
 * Lifetime of a tag's invalidation counter, well above any entry TTL: a load that read the
 * version before an invalidation must still see it changed when it tries to write.
 */
export const CACHE_TAG_VERSION_TTL_SECONDS = 24 * 60 * 60;

/** Max JSON body size (uploads use a separate multipart route in Phase 3). */
export const JSON_BODY_LIMIT = '100kb';

/** Rate limits: `points` requests per `durationSeconds`, per key. */
export const RATE_LIMITS = {
  /** Every API request, per client IP (except the web server's and signed-in admins'). */
  GLOBAL: { points: 100, durationSeconds: 60 },
  /**
   * The Next.js server (SSR, ISR, sitemap) with a valid internal token: one shared bucket for
   * all its egress IPs, sized for a full static rebuild.
   */
  INTERNAL: { points: 3000, durationSeconds: 60 },
  /** Admin API requests, per signed-in user (offices share one IP). */
  ADMIN_PER_USER: { points: 300, durationSeconds: 60 },
  /** Login attempts per client IP. */
  LOGIN_PER_IP: { points: 10, durationSeconds: 15 * 60 },
  /** Login attempts per email (existing or not), so throttling reveals nothing. */
  LOGIN_PER_EMAIL: { points: 5, durationSeconds: 15 * 60 },
  /** Token refreshes per client IP. */
  REFRESH_PER_IP: { points: 30, durationSeconds: 15 * 60 },
} as const;

/** Browser features the API never needs; sent as Permissions-Policy. */
export const PERMISSIONS_POLICY =
  'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()';

/** HSTS lifetime (1 year), the minimum for the preload list. */
export const HSTS_MAX_AGE_SECONDS = 31_536_000;

/** Max time a readiness probe waits for each dependency. */
export const HEALTH_CHECK_TIMEOUT_MS = 2_000;

/** Longest string kept in an audit diff; longer values (e.g. rich text) are marked truncated. */
export const AUDIT_VALUE_MAX_LENGTH = 2_000;

/** Account lockout (CLAUDE.md §8): 5 wrong passwords lock the account for 15 minutes. */
export const LOGIN_LOCKOUT = {
  MAX_FAILED_ATTEMPTS: 5,
  DURATION_MS: 15 * 60 * 1000,
} as const;

/**
 * A refresh token presented again within this window after being rotated is treated as a
 * benign race (two tabs refreshing at once): rejected, but the session is not revoked.
 */
export const REFRESH_REUSE_GRACE_MS = 10_000;

/** Stored user-agent length (matches the VARCHAR(512) columns). */
export const USER_AGENT_MAX_LENGTH = 512;

/** Keep-alive above typical load balancer idle timeouts (60s); headers timeout just above it. */
export const HTTP_TIMEOUTS = {
  KEEP_ALIVE_MS: 65_000,
  HEADERS_MS: 66_000,
} as const;

/** Revalidation webhook: tags from writes within this window go out in one signed request. */
export const REVALIDATION_WEBHOOK = {
  COALESCE_MS: 250,
  TIMEOUT_MS: 3_000,
  /** Delays before each retry; the first attempt runs immediately. */
  RETRY_DELAYS_MS: [500, 2_000, 8_000],
} as const;

/** In-process email queue (docs/phases/03 §6): small, retried, drained on shutdown. */
export const EMAIL_QUEUE = {
  CONCURRENCY: 2,
  /** Delays before each retry; the first attempt runs immediately. */
  RETRY_DELAYS_MS: [1_000, 5_000, 25_000],
  /** Shutdown waits this long for queued mail (inside SHUTDOWN_TIMEOUT_MS). */
  DRAIN_TIMEOUT_MS: 5_000,
} as const;

/** Cloudflare Turnstile server-side verification. */
export const TURNSTILE = {
  VERIFY_URL: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  TIMEOUT_MS: 5_000,
} as const;

/** Rows fetched per query while streaming a CSV export. */
export const EXPORT_BATCH_SIZE = 500;

/** Emailed password reset links: single use, short-lived. */
export const PASSWORD_RESET = {
  TOKEN_BYTES: 32,
  TTL_MINUTES: 60,
} as const;

/** How often scheduled posts/projects are checked for going live (revalidation precision). */
export const PUBLICATION_CHECK_INTERVAL_MS = 60_000;
