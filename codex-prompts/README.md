# Codex

Bilingual (Arabic default, English) website for **Codex**, a digital agency offering Software Development, Branding and Marketing. Includes a public site, a REST API and an admin dashboard.

Project rules live in [`CLAUDE.md`](./CLAUDE.md); phase-by-phase specs live in [`docs/phases/`](./docs/phases).

## Stack

| Layer    | Technology                                                      |
| -------- | --------------------------------------------------------------- |
| Monorepo | pnpm workspaces + Turborepo                                     |
| Web      | Next.js (App Router) + React + Tailwind CSS                     |
| API      | Node.js + Express + TypeScript                                  |
| Data     | PostgreSQL + Prisma (Phase 1), Redis (Phase 2)                  |
| Shared   | zod schemas, types, enums, constants (`@codex/shared`)          |
| Emails   | React Email (`@codex/emails`)                                   |
| Quality  | TypeScript strict, ESLint, Prettier, Vitest, Husky + commitlint |

## Repository layout

```
apps/
  web/          Next.js public site (+ /admin in Phase 6)       → http://localhost:3000
  api/          Express REST API                                → http://localhost:4000
packages/
  shared/       zod schemas, types, enums, constants (single source of truth)
  config/       shared tsconfig, ESLint and Prettier presets
  emails/       React Email templates
docs/phases/    phase specifications
```

`apps` depend on `packages`; packages never import from apps.

## Prerequisites

- **Node.js 24 LTS** (see `.nvmrc`; `nvm use` or `fnm use`)
- **pnpm 12** via Corepack: `corepack enable pnpm` (version pinned in `package.json#packageManager`)
- **Docker** with the **Compose v2 plugin** (`docker compose version` must work). Docker Desktop and OrbStack ship it. With Colima:
  ```bash
  brew install colima docker docker-compose
  # Homebrew installs Compose outside Docker's default plugin path; register it in ~/.docker/config.json:
  #   "cliPluginsExtraDirs": ["/opt/homebrew/lib/docker/cli-plugins"]
  colima start
  ```

## Setup

```bash
pnpm install

# Environment files (every variable is documented inline)
cp .env.example .env                  # docker-compose credentials (incl. the app DB role)
cp apps/api/.env.example apps/api/.env # match DATABASE_URL / DIRECT_URL / REDIS_URL to .env; set ADMIN_PASSWORD
# …and generate the API secrets (commands are in apps/api/.env.example):
#   JWT_PRIVATE_KEY=$(openssl genpkey -algorithm ed25519 | base64 | tr -d '\n')
#   CSRF_SECRET / IP_HASH_SECRET=$(openssl rand -base64 32)
cp apps/web/.env.example apps/web/.env.local

# Local Postgres + Redis
docker compose up -d
docker compose ps                     # both services should be "healthy"

# Database: generate the client, apply migrations, load bilingual demo content
pnpm db:migrate
pnpm db:generate                      # Prisma 7's migrate dev no longer regenerates the client
pnpm db:seed                          # safe to re-run

# Run web (3000) and api (4000) in watch mode
pnpm dev
```

Check the API: `curl http://localhost:4000/health` (liveness) and `curl http://localhost:4000/health/ready` (database + Redis). API docs: http://localhost:4000/api/docs.

Both apps validate their environment with zod on startup and exit with a readable list of problems if anything is missing or invalid.

## Scripts (run from the repo root)

| Script                   | What it does                                         |
| ------------------------ | ---------------------------------------------------- |
| `pnpm dev`               | Runs every app in watch mode (builds packages first) |
| `pnpm build`             | Production build of all workspaces                   |
| `pnpm lint`              | ESLint, zero warnings allowed                        |
| `pnpm typecheck`         | `tsc --noEmit` in every workspace                    |
| `pnpm test`              | Unit tests in every workspace (no services needed)   |
| `pnpm test:integration`  | API integration tests (needs `docker compose up -d`) |
| `pnpm test:coverage`     | Unit + integration with coverage (≥ 80% services)    |
| `pnpm test:e2e`          | Builds, then Playwright smoke tests on the web build |
| `pnpm format`            | Prettier write                                       |
| `pnpm format:check`      | Prettier check (used in CI)                          |
| `pnpm db:generate`       | Generate the Prisma client (also runs before builds) |
| `pnpm db:migrate`        | Create/apply migrations in development               |
| `pnpm db:migrate:deploy` | Apply committed migrations (CI / production)         |
| `pnpm db:seed`           | Idempotent seed: admin + bilingual demo content      |
| `pnpm db:studio`         | Prisma Studio                                        |
| `pnpm db:reset`          | Drop and recreate the local database (destructive)   |

## Database

- **Schema:** `apps/api/prisma/schema.prisma` (Prisma 7; connection URLs live in `apps/api/prisma.config.ts`). Localized text is JSONB `{ ar, en }` validated by the zod schemas in `@codex/shared` before every write; slugs are separate `slugAr` / `slugEn` columns.
- **Two roles (least privilege):** migrations and Studio use `DIRECT_URL` (the schema owner); the API uses `DATABASE_URL` as `APP_DB_USER`, which can only read and write rows. Locally, `docker/postgres/init/01-app-role.sh` creates that role the first time the data volume is initialized. If your volume predates it, recreate it with `docker compose down -v && docker compose up -d` (this deletes local data).
- **Production (Neon):** `DATABASE_URL` is the pooled connection string of an app role you create once with the same grants as the init script; `DIRECT_URL` is the owner's direct (non-pooled) string, used only by `pnpm db:migrate:deploy`. The `harden_app_privileges` migration then makes `audit_logs` append-only and hides `_prisma_migrations` from every non-owner role.
- **Seed:** creates the first admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (refuses weak passwords) and, outside production, demo content. It never overwrites existing rows, so seed content changes do not reach an existing database (edit them in the admin instead). Everything marked `[Client Name]`, `[Team Member n]`, `[+00%]`, `placeholder/*` media, the contact details and the homepage stats are placeholders to replace before launch.

## API (`apps/api`)

- **Pipeline:** request id → pino-http (no bodies, headers, queries or IPs; emails/phones masked) → helmet (JSON-only CSP, HSTS, no-referrer, Permissions-Policy, `no-store`) → CORS allow-list (`FRONTEND_URL`, credentials) → compression → 100kb JSON → cookies → traffic limits → Origin check on state-changing requests → routes → 404 → error handler.
- **Rate limits:** 100/min per IP by default; the Next.js server sends `X-Codex-Internal: <INTERNAL_API_TOKEN>` (server-only) for its own 3000/min bucket, so SSR/ISR from a few Vercel IPs is never throttled; signed-in admins get 300/min per user; login 10 per 15 min per IP; each public form 5/hour per IP.
- **Errors:** `{ success: false, error: { code, message, details?, requestId } }`; `message` and `details[].message` are i18n keys, never internals.
- **Auth** (`/api/v1/auth/*`): EdDSA access token (15 min) in the httpOnly `codex_at` cookie, valid only while its session is; opaque refresh token (`codex_rt`, path `/api/v1/auth`, stored hashed) rotated on every use; replaying a rotated token revokes the session (7-day sliding, 30-day max); a concurrent refresh from another tab gets `409 REFRESH_CONFLICT` (retry the request). Signed double-submit CSRF (`codex_csrf` cookie → `X-CSRF-Token` header) on refresh, logout and every admin write. 5 wrong passwords lock an account for 15 minutes. Admins can email a single-use reset link (`POST /admin/users/:id/reset-password` → `POST /auth/password-reset`).
- **Public reads** (`/api/v1/public/*`): published content only (`status = PUBLISHED` and `publishedAt <= now()`), mapped to DTOs (`@codex/shared` `*DtoSchema`). Cached in Redis for 1 hour with tags (`CACHE_TAGS`); entries expire at the next scheduled publish, and a 60-second check announces content going live. Responses send `Cache-Control: public, no-cache` and an ETag (304 when unchanged). `?locale=` picks the slug column. Blog search (`q`) uses a trigram index on normalized text (Arabic diacritics, hamza and ta marbuta forms ignored).
- **Admin** (`/api/v1/admin/*`): one gate (session, per-user limit, CSRF on writes), then permissions from `ROLE_PERMISSIONS`. CRUD with allow-listed sorting, Arabic-safe slugs (explicit slugs must be free, generated ones get `-2`, `-3`…), reading time on save, reorder endpoints, leads with assignment/notes and streamed CSV export (formula-injection safe), users (last active admin protected), media, settings, dashboard stats and the audit log. Every write is audited in its transaction; after commit, Redis tags are invalidated and the web app is told through the revalidation webhook.
- **Revalidation webhook:** `POST ${FRONTEND_URL}/api/revalidate` with `{ tags }`, headers `x-codex-timestamp` and `x-codex-signature: v1=<hex HMAC-SHA256(REVALIDATE_SECRET, "<timestamp>.<body>")>`; verify with `verifyRevalidation` from `@codex/shared` (5-minute window). Coalesced, retried, never blocks a write. Disabled without `REVALIDATE_SECRET`.
- **Forms** (`POST /public/contact`, `/public/quote`): rate limit → honeypot (`website`, silently discarded) → Turnstile (fails closed; skipped only when `TURNSTILE_SECRET_KEY` is unset outside production) → zod → saved with `ipHash` and `locale` → `201 { received: true }`. The company notification and the client confirmation are sent by an in-process queue (retry 1s/5s/25s, drained on shutdown; a crash can lose queued mail, the lead itself is saved).
- **Emails** (`@codex/emails`): branded templates (RTL for Arabic) with plain-text versions; sent through Resend, or only logged (recipient masked) without `RESEND_API_KEY`.
- **Media:** `POST /admin/media` (multipart `file` + `altAr`/`altEn`, max 5 MB): the type comes from the file bytes (JPEG, PNG, WebP, AVIF; SVG refused), the image is re-encoded without metadata (EXIF/GPS stripped) and stored on Cloudinary in `CLOUDINARY_FOLDER`. Delete is refused (409 `MEDIA_IN_USE`, listing every use, including images inside rich text); seeded `placeholder/*` media never touch Cloudinary.
- **Redis is optional:** without it (unset or down) there is no cache and rate limits fall back to memory; `/health/ready` reports `degraded`, not down. Invalidations missed during an outage flush the cache when Redis returns.
- **Docs:** Swagger UI at `/api/docs` (raw document: `/api/docs/openapi.json`) documents every route with request and response schemas; open outside production; in production only with `DOCS_USERNAME` / `DOCS_PASSWORD`, behind basic auth.
- **Tests:** `pnpm test` (unit), `pnpm test:integration` (separate `codex_test` database and Redis database 1, tables truncated before each test; Cloudinary, Resend and Turnstile are always mocked), `pnpm test:coverage` (both, ≥ 80% on `*.service.ts`). `pnpm --filter @codex/api bench` benchmarks cached public reads against a running API (set `INTERNAL_API_TOKEN` in both).

## Web (`apps/web`)

- **Routing:** `/ar/...` (default, RTL) and `/en/...` (LTR), English path segments in both. `/` follows `Accept-Language` on the first visit; switching language stores the choice in the `NEXT_LOCALE` cookie. Messages live in `src/messages/{ar,en}.json` (typed keys; a test fails if any `validation.*` / `errors.*` key from `@codex/shared` is missing). Pages with per-locale slugs render `<RegisterAlternatePaths ar en />` so the language switcher keeps the visitor on the same content.
- **Security headers:** `src/proxy.ts` sets a per-request nonce CSP (`script-src 'self' 'nonce-…' 'strict-dynamic'`; only Cloudinary images, the API and Turnstile as third parties). Static headers (HSTS, nosniff, Referrer-Policy, Permissions-Policy, frame denial) come from `next.config.ts`. A nonce means every page renders per request; data is still cached by Next.js under the API's `CACHE_TAGS`.
- **Client bundles:** import constants from `@codex/shared/constants` in `'use client'` code. The package root pulls in zod, which probes `new Function` at load (a CSP violation) and adds weight. `pnpm build` ends with `scripts/check-client-bundle.mjs`, which fails if a browser chunk contains zod or the value of `INTERNAL_API_TOKEN` / `REVALIDATE_SECRET`.
- **API client** (`src/lib/api`, server-only): typed `apiFetch` with a 5 s timeout, the `X-Codex-Internal` header, `next: { tags, revalidate: 3600 }` caching, zod validation outside production, and `withFallback` for non-critical sections.
- **Revalidation:** `POST /api/revalidate` verifies the API's signed webhook (`verifyRevalidation`) and expires the received tags at once (`revalidateTag(tag, { expire: 0 })`).
- **Env:** `INTERNAL_API_TOKEN` and `REVALIDATE_SECRET` must equal the API's values (required in production). `ENABLE_UI_SHOWCASE=true` serves `/[locale]/dev/ui` on a production build (local audits only; it is always on in `next dev`).
- **Design system:** brand tokens and `.surface-dark` / `.surface-light` / `.surface-white` in `src/styles/globals.css` (Tailwind's default palette is removed); primitives in `src/components/ui`, motion in `src/components/motion` (lazy `domAnimation`, reduced motion respected).
- **E2E:** `pnpm test:e2e` (first time: `pnpm --filter @codex/web exec playwright install chromium`). Smoke tests for the header, mobile menu, language switcher, 404 and zero CSP violations in both locales.

Email templates preview: `pnpm --filter @codex/emails preview` → http://localhost:3001.

## Quality gates

- **Pre-commit:** lint-staged runs ESLint (`--max-warnings=0`) and Prettier on staged files.
- **Commit messages:** [Conventional Commits](https://www.conventionalcommits.org/) enforced by commitlint (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:` …).
- **CI** (`.github/workflows/ci.yml`): audit → format check → lint → typecheck → test → build, a Playwright job (`pnpm test:e2e` against the production web build, without the API), plus a database job (migrate from scratch, drift check, seed twice, integration tests with Postgres + Redis) on every PR and push to `main`.
- **Dependabot:** weekly updates for npm, GitHub Actions and Docker images.
