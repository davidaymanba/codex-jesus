# Phase 7: Testing, Hardening, Performance Audit and Launch

> Read `CLAUDE.md` first. Present your plan and wait for approval.

## Goal
Prove the project is production-ready: complete tests, security audit, performance audit, accessibility, monitoring, deployment, and documentation.

## 1. Testing
- **Unit tests:** shared schemas, utils, services (≥ 80% coverage on API services).
- **Integration tests:** all API endpoints (Supertest + test DB).
- **E2E tests (Playwright)**, both locales, mobile and desktop viewports:
  - Navigation through all public pages, language switching keeps the page
  - Contact form and full quote form flow
  - Portfolio filter and blog search
  - Admin: login, CRUD, leads workflow, role restrictions
- Add E2E to CI (against a preview build).

## 2. Security Audit (fix everything found, then report)
Go through this checklist and report the status of each item:
- [ ] OWASP Top 10 and API Security Top 10 review of every endpoint (auth, access control, injection, mass assignment, rate limits)
- [ ] Attempt: accessing admin endpoints without and with an editor role (IDOR / privilege escalation)
- [ ] Attempt: XSS payloads in every text and rich-text field → rendered safely on the site and in emails
- [ ] Attempt: CSRF on admin mutations without the token → rejected
- [ ] Attempt: refresh token reuse → the family is revoked
- [ ] Attempt: upload a disguised file (e.g., HTML renamed to .png) → rejected
- [ ] Attempt: CSV injection in lead fields → escaped in export
- [ ] Security headers on web and API (verify against securityheaders.com-level standards: A+ target)
- [ ] CSP has no `unsafe-inline` / `unsafe-eval` for scripts
- [ ] `pnpm audit`: no high or critical vulnerabilities
- [ ] No secrets in the repo or git history (run a secret scanner such as gitleaks)
- [ ] Error responses leak no stack traces or internals in production mode
- [ ] Logs contain no passwords, tokens, or unmasked PII
- [ ] Database: app user has least privilege; backups enabled on Neon (point-in-time restore)

## 3. Performance Audit
- Run Lighthouse (mobile) on every public page type in both locales; report a table of scores. Targets from `CLAUDE.md` must be met; fix anything below.
- Bundle analysis (`@next/bundle-analyzer`): report first-load JS per route; remove or lazy-load anything heavy.
- Check images (formats, sizes), fonts (preload, subsetting, no CLS), and third-party scripts.
- API load test with `autocannon` or `k6` on key public endpoints: report p50/p95/p99 and throughput; confirm cache hit rates.
- Check the DB with `EXPLAIN ANALYZE` on list and search queries; add missing indexes.

## 4. Accessibility Audit
- axe checks in Playwright on all pages (zero serious or critical violations).
- Manual keyboard-only navigation through the site and admin.
- Screen reader sanity check on forms (labels, errors, live regions).
- Contrast check for all color combinations used.

## 5. Monitoring and Observability
- Sentry on web (client + server) and API: environment tags, release tracking, source maps uploaded (not publicly served), PII scrubbing enabled.
- Structured logs (pino) shipped from Railway; include `requestId` for tracing between web and API.
- Uptime monitoring for `/health/ready` (document how to set it up, e.g., Better Stack or UptimeRobot).
- Vercel Speed Insights or equivalent for real-user Core Web Vitals.

## 6. Deployment
- **Database:** Neon (production branch), pooled URL for the app, direct URL for migrations.
- **Redis:** Upstash.
- **API:** Railway; Dockerfile (multi-stage, Node LTS slim/distroless, non-root user, only production deps), healthcheck, `prisma migrate deploy` on release (not `migrate dev`).
- **Web:** Vercel; environment variables per environment (preview / production).
- **Domains:** `codex.com` (web) and `api.codex.com` (API) with HTTPS; cookie domain configured for both.
- CI/CD: on merge to main → run all checks → deploy. Preview deployments for PRs.
- Document a rollback procedure.

## 7. Launch Checklist
- [ ] Real logo, fonts, content, and images replaced all placeholders
- [ ] Admin password changed from the seed value; seed disabled in production
- [ ] Swagger disabled or protected in production
- [ ] Google Search Console + sitemap submitted; analytics installed (privacy-friendly, loaded without blocking)
- [ ] Favicons, app icons, and web manifest in brand style
- [ ] Emails tested from the production domain (SPF, DKIM, DMARC configured in Resend)
- [ ] 404 and error pages verified in production

## 8. Documentation
- **README:** overview, architecture diagram (Mermaid), local setup, scripts, environment variables table, deployment, troubleshooting.
- **docs/ADMIN_GUIDE.md:** how to add posts, projects, services, manage leads, and upload media (written for non-technical users, in Arabic and English).
- **docs/ARCHITECTURE.md:** key decisions and why (monorepo, caching strategy, auth design, i18n approach).
- **docs/SECURITY.md:** security measures, how to report issues, secret rotation procedure.

## Final Report
Provide: test coverage summary, security checklist results, Lighthouse table, bundle sizes, API benchmark results, and any known limitations with recommendations.
