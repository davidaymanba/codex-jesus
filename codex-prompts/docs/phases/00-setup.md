# Phase 0: Monorepo Setup and Tooling

> Read `CLAUDE.md` first. Present your plan and wait for approval before writing code.

## Goal
A clean, fully configured monorepo foundation where both apps run, and quality tooling is enforced from day one.

## 1. Monorepo
- pnpm workspaces + Turborepo.
- Workspaces: `apps/web`, `apps/api`, `packages/shared`, `packages/config`, `packages/emails`.
- Root scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `format`, `db:migrate`, `db:seed`, `db:studio`.
- `turbo.json` with correct pipelines, caching, and task dependencies (`build` depends on `^build`).
- `.nvmrc` with Node LTS; `engines` field in the root `package.json`; `packageManager` field pinned.

## 2. Shared Configs (`packages/config`)
- `tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`, `forceConsistentCasingInFileNames`, path aliases.
- ESLint flat config: typescript-eslint (strict + stylistic, type-aware), `eslint-plugin-import` (ordering, no cycles), `jsx-a11y`, react/react-hooks (web only), `no-console: error`, `@typescript-eslint/no-explicit-any: error`.
- Prettier config (with the Tailwind class-sorting plugin for web).

## 3. Shared Package (`packages/shared`)
Set up the structure only (content comes in later phases):
```
src/
├─ constants/   # LOCALES, DEFAULT_LOCALE, PAGINATION limits, ROLES, statuses
├─ enums/       # ServiceCategory, ProjectStatus, LeadStatus, Team, Role...
├─ schemas/     # zod schemas (per feature)
├─ types/       # inferred types + API response types
└─ index.ts
```
- Define the standard API response shapes now:
  - Success: `{ success: true, data, meta? }` (meta holds pagination: `page`, `pageSize`, `total`, `totalPages`)
  - Error: `{ success: false, error: { code, message, details? } }`
- Define `LocalizedString = { ar: string; en: string }` and its zod schema.
- Build with `tsup` (ESM + types).

## 4. API App Skeleton (`apps/api`)
- Express + TypeScript, run with `tsx` in dev, built with `tsup`.
- Folder structure:
```
src/
├─ config/        # env (zod-validated), constants
├─ lib/           # logger, prisma client, redis client
├─ middlewares/
├─ modules/       # feature modules (added later)
├─ utils/
├─ app.ts         # express app (no listen, exported for tests)
└─ server.ts      # starts the server + graceful shutdown
```
- `GET /api/v1/health` returns `{ status, uptime, timestamp }`.
- Env validation with zod: the app exits with a clear message if the env is invalid.

## 5. Web App Skeleton (`apps/web`)
- Next.js (latest, App Router, TypeScript, Tailwind, ESLint), `src/` directory.
- Base home page renders "Codex" only (design comes in Phase 4).
- Env validation with zod (split server env and `NEXT_PUBLIC_` client env).

## 6. Emails Package (`packages/emails`)
- React Email setup with one placeholder template and a preview script.

## 7. Local Infrastructure
- `docker-compose.yml`: PostgreSQL (latest stable) + Redis, with named volumes, healthchecks, and non-default credentials read from `.env`.
- `.env.example` for root, api, and web, with every variable documented by a comment.

## 8. Git and Quality Gates
- `.gitignore` (node_modules, .env*, builds, .turbo, coverage…), `.editorconfig`.
- Husky: pre-commit → lint-staged (eslint --fix + prettier on staged files); commit-msg → commitlint (Conventional Commits).
- GitHub Actions CI (`.github/workflows/ci.yml`): install (with pnpm cache) → lint → typecheck → test → build on every PR and push to main.
- Dependabot config for npm and GitHub Actions (weekly).

## 9. Testing Setup
- Vitest configured in `api`, `web`, and `shared`, with a sample test in each so `pnpm test` passes.

## 10. README (initial)
- Project overview, prerequisites (Node, pnpm, Docker), setup steps, available scripts.

## Acceptance Criteria
- [ ] `pnpm install && docker compose up -d && pnpm dev` runs web (port 3000) and api (port 4000)
- [ ] `/api/v1/health` responds correctly
- [ ] Removing a required env variable makes the app fail fast with a readable error
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass
- [ ] A commit with a bad message is rejected; lint errors block commits
- [ ] CI workflow is valid
