# CLAUDE.md: Codex Website Project Guide

> Read this file fully before starting ANY task. The rules here apply to EVERY phase.
> Phase-specific instructions live in `/docs/phases/`. Only work on the phase I ask for.

---

## 1. About the Project

**Codex** is a digital agency offering three service pillars:

1. **Software Development**: E-commerce, E-learning platforms, ERP systems, CRM systems, Salla stores, Shopify stores, WordPress, AI Agents, and workflow automation with n8n.
2. **Branding**: brand identity, logo design, visual systems, brand guidelines.
3. **Marketing**: digital marketing, social media, content, paid ads, SEO.

Codex has three dedicated teams (Brand Team, Marketing Team, Development Team) and has delivered many projects.

**What we are building:** a professional, bilingual (Arabic default + English) company website with services, portfolio (case studies), blog, contact and quote-request forms, a Node.js backend API, and an admin dashboard to manage all content and leads.

**Quality bar:** production-grade. Clean code, high performance, and strong security are non-negotiable requirements, not nice-to-haves.

---

## 2. How We Work (Workflow Rules)

1. At the start of each phase: read `CLAUDE.md` + the phase file, then reply with a **plan** (files to create/modify, key decisions, open questions). **Wait for my approval before writing code.**
2. Work in small, focused steps. Commit after each logical unit using **Conventional Commits** (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
3. At the end of each phase, run and make pass: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
4. Then give me a **phase report**: what was done, how to run and verify it, any deviations from the plan and why, and remaining TODOs.
5. Never claim something works without verifying it. Never leave silent TODOs; list them in the report.
6. If a requirement is unclear or conflicts with another, **ask**; do not guess.
7. Do not add a dependency without a one-line justification. Prefer well-maintained, lightweight, widely used packages. Always use the latest stable versions.
8. Do not modify files outside the scope of the current phase unless necessary; if you must, say so in the report.

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Language | TypeScript (strict) everywhere |
| Frontend | React via Next.js (latest, App Router, Server Components) |
| Styling | Tailwind CSS + shadcn/ui + Framer Motion (via `motion` package) + lucide-react |
| i18n | next-intl (`ar` default RTL, `en` LTR) |
| Frontend data | Server-side fetch with Next.js caching/tags; TanStack Query in admin |
| Forms | react-hook-form + zod (schemas from `packages/shared`) |
| Backend | Node.js (LTS) + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Cache / Rate-limit store | Redis (Docker locally, Upstash in production) |
| Auth | JWT access + rotating refresh tokens in httpOnly cookies, argon2id hashing |
| Media | Cloudinary |
| Email | Resend + React Email templates |
| Bot protection | Cloudflare Turnstile + honeypot |
| Docs | OpenAPI / Swagger UI |
| Testing | Vitest, Supertest, Playwright |
| Monitoring | Sentry (frontend + backend), pino logs |
| Deploy | Vercel (web), Railway (api), Neon (Postgres), Upstash (Redis) |

---

## 4. Repository Structure

```
codex/
├─ apps/
│  ├─ web/            # Next.js: public website + /admin dashboard
│  └─ api/            # Express REST API
├─ packages/
│  ├─ shared/         # zod schemas, types, enums, constants (single source of truth)
│  ├─ config/         # shared eslint, tsconfig, prettier configs
│  └─ emails/         # React Email templates
├─ docs/
│  └─ phases/         # phase instructions (this folder)
├─ docker-compose.yml # postgres + redis for local dev
├─ turbo.json
├─ CLAUDE.md
└─ README.md
```

---

## 5. Brand Identity (follow strictly)

### Logo
Modified letter **"C"** integrating code brackets **"{}"**, bold, blocky, geometric. Files go in `apps/web/public/brand/` (`logo.svg`, `logo-white.svg`, `icon.svg`). Use a clean placeholder until provided. The `{}` bracket motif may be used subtly as a decorative element.

### Colors: the ONLY colors allowed (define as CSS variables + Tailwind tokens)

| Token | Hex | Usage |
|---|---|---|
| `navy-950` | `#0E0F31` | Dark section backgrounds, primary text on light |
| `indigo-700` | `#4B4D83` | Secondary text, borders on dark |
| `lavender-200` | `#C5C6E3` | Muted text on dark, subtle borders |
| `lavender-50` | `#F2F3FF` | Light section backgrounds |
| `blue-700` | `#0049B2` | Primary brand blue, gradients, links on light |
| `blue-500` | `#4E94FF` | Highlights, links on dark, focus rings |
| `blue-300` | `#99C2FF` | Soft accents |
| `blue-100` | `#CCE0FF` | Tinted backgrounds, badges |
| `gold-500` | `#FFC100` | Primary CTA buttons (navy text) |
| `gold-400` | `#FFCF48` | CTA hover |
| `gold-200` | `#FFE197` | Soft accent |
| `gold-50` | `#FFF1D2` | Light accent backgrounds |

Plus pure white `#FFFFFF` for cards on light sections.

**Color rules:**
- Gold is an **accent**: CTAs and key highlights only. Never gold text on light backgrounds.
- All text/background pairs must pass **WCAG AA** contrast.
- No hard-coded hex values in components; always use tokens.

### Typography
| Usage | English | Arabic |
|---|---|---|
| Display headings | Morrison (uppercase, large sizes only) | Rubik (Bold) |
| Headings | Neue Montreal Bold | Rubik (Medium/Bold) |
| Body / UI | Neue Montreal (Light 300 / Medium 500) | Noto Sans Arabic (Light / Medium) |

- Neue Montreal and Morrison are local files in `apps/web/public/fonts/` loaded with `next/font/local`. Rubik and Noto Sans Arabic are loaded via `next/font/google`.
- Font family switches automatically by locale. Always define fallback stacks. Use `font-display: swap`.

### Visual style: mixed dark and light
- Alternate dark sections (`navy-950`) and light sections (`lavender-50` / white) for rhythm. Header, hero, and footer are dark.
- Premium tech-agency feel: generous whitespace, large type, rounded cards (16–24px), subtle borders, soft shadows, subtle blue gradient glows, faint grid/code patterns.
- Motion is subtle and purposeful. Always respect `prefers-reduced-motion`.

---

## 6. Clean Code Standards

**TypeScript**
- `strict: true`, `noUncheckedIndexedAccess: true`. No `any`; use `unknown` + narrowing. No `@ts-ignore`. Avoid non-null assertions (`!`).
- Types inferred from zod schemas (`z.infer`) and shared from `packages/shared`. Never duplicate a type or schema.

**Structure**
- Organize by **feature/module**, not by file type.
- Single Responsibility: small functions (aim for under 40 lines) and small files (aim for under 250 lines); split when larger.
- Backend layering is mandatory: `routes → controllers (HTTP only) → services (business logic) → repositories (data access only)`. Prisma is used **only** inside repositories.
- Frontend: Server Components by default. `"use client"` only where interactivity is required, pushed to the smallest leaf components.
- Dependency direction: `apps` depend on `packages`; packages never import from apps.

**Naming and style**
- Descriptive names. Booleans read as questions (`isPublished`, `hasAccess`). Functions are verbs (`getPublishedPosts`).
- Files: `kebab-case.ts`; React components: `PascalCase.tsx`; constants: `UPPER_SNAKE_CASE`.
- No magic strings or numbers: use enums and constants from `packages/shared`.
- Comments explain **why**, not what. JSDoc on exported functions in shared packages.
- No dead code, no commented-out code, no `console.log` (use the logger).

**Errors**
- Typed error classes (`AppError`, `NotFoundError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`, `RateLimitError`).
- Never swallow errors. Handle at the boundary; log once with context.

**Tooling (enforced)**
- ESLint (typescript-eslint strict + react + jsx-a11y + import order), Prettier, Husky + lint-staged pre-commit, commitlint.

---

## 7. Performance Standards (budgets)

**Frontend (public pages, mobile, production build):**
- Lighthouse: Performance ≥ 95, Accessibility ≥ 95, Best Practices = 100, SEO = 100.
- Core Web Vitals: LCP < 2.0s, INP < 200ms, CLS < 0.05.
- First-load JS per public page: under 130 KB gzipped (report the actual numbers).
- Static/ISR rendering for all public pages; no client-side data fetching on public pages.
- `next/image` for every image (correct `sizes`, AVIF/WebP, `priority` only on the LCP image). Fonts preloaded and subset.
- Heavy or below-the-fold client components loaded with dynamic import. Animation code must not block rendering.

**Backend:**
- p95 latency: under 100ms for cached public reads, under 300ms for uncached reads and writes.
- Redis caching for public GET endpoints with tag-based invalidation on write.
- Efficient queries: select only needed fields, proper indexes, no N+1 queries, pagination on every list (max page size 50).
- gzip/brotli compression, keep-alive, connection pooling (Prisma + Neon pooled URL).

---

## 8. Security Standards (baseline, applies everywhere)

- Follow **OWASP Top 10** and **OWASP API Security Top 10**.
- **Secrets:** only in environment variables, validated with zod at startup (the app fails fast if invalid). Never commit `.env`. Never log secrets, tokens, passwords, or full PII.
- **Input:** validate every request (body, params, query) with zod at the boundary. Strip unknown fields. Enforce length limits on every string.
- **Output:** never render unsanitized HTML. Rich text is sanitized on save (server) and rendered via a whitelist renderer.
- **Auth:** argon2id hashing, short-lived access tokens (15 min), rotating refresh tokens (hashed in the DB, reuse detection revokes the whole family), httpOnly + Secure + SameSite cookies, CSRF protection on state-changing requests, account lockout after repeated failed logins.
- **Authorization:** deny by default. Role checks (RBAC) on every admin route. Public endpoints return published content only.
- **Transport and headers:** HTTPS only, HSTS, strict CSP (nonce-based on web), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, frame protection. CORS allow-list only.
- **Abuse:** rate limiting (Redis-backed) on all public endpoints, strict limits on login, contact, and quote. Turnstile + honeypot on public forms. Request body size limits.
- **Uploads:** validate type by magic bytes (not extension), size limits, allow-list of image types, strip EXIF.
- **Dependencies:** lockfile committed, `pnpm audit` clean (no high/critical), Dependabot enabled.
- **Least privilege:** separate DB user for the app; admin-only operations logged in an **audit log**.
- **Errors:** never expose stack traces or internal details to clients in production.

---

## 9. i18n Rules

- Locales: `ar` (default, RTL) and `en` (LTR). Routes: `/ar/...` and `/en/...`.
- No hard-coded UI strings: everything in `messages/ar.json` and `messages/en.json`.
- Use CSS logical properties only (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`). Mirror directional icons in RTL.
- Arabic copy must be natural, modern Arabic, not a literal translation.
- Dates and numbers formatted with `Intl` per locale.

---

## 10. Definition of Done (every phase)

- [ ] All phase requirements implemented and manually verified
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass with zero errors and zero warnings
- [ ] No `any`, no `console.log`, no hard-coded strings or colors
- [ ] Security and performance rules from this file respected
- [ ] Works in both `ar` (RTL) and `en` (LTR), on mobile and desktop
- [ ] README / docs updated if setup or behavior changed
- [ ] Phase report delivered
