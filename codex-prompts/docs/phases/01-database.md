# Phase 1: Database Schema, Shared Schemas and Seed

> Read `CLAUDE.md` first. Present your plan (including the full Prisma schema draft) and wait for approval.

## Goal
A well-designed, indexed, secure database schema with shared validation schemas and realistic bilingual seed data.

## 1. Localization Strategy
- Localized text fields are stored as **JSONB** `{ ar: string, en: string }`.
- Slugs are separate indexed columns per locale: `slugAr`, `slugEn` (each unique), for fast lookups.
- Validate the JSON shape with zod before every write (Prisma does not enforce it).

## 2. Prisma Models
All models include `id` (cuid2 or uuid), `createdAt`, and `updatedAt`. Use enums for fixed values.

1. **User**: name, email (unique, lowercase), passwordHash, role (`ADMIN`, `EDITOR`), isActive, failedLoginAttempts, lockedUntil, lastLoginAt.
2. **RefreshToken**: userId, tokenHash (unique), familyId, expiresAt, revokedAt, replacedById, userAgent, ipHash. Indexed on userId and familyId.
3. **Media**: url, publicId, alt (localized), width, height, mimeType, sizeBytes, uploadedById.
4. **Service**: title, shortDescription, content (rich text JSON, localized), icon, category (`DEVELOPMENT`, `BRANDING`, `MARKETING`), subServices (JSON array, localized), benefits (JSON), faqs (JSON), coverId, order, status, seo (JSON: metaTitle, metaDescription, ogImageId).
5. **Project**: title, slugAr, slugEn, client, industry (localized), coverId, gallery (relation to Media), challenge, solution, results (JSON: metric + value, localized), techStack (string[]), featured, status (`DRAFT`, `PUBLISHED`), publishedAt, order, seo. Many-to-many with Category.
6. **Post**: title, slugAr, slugEn, excerpt, content (rich text JSON, localized), coverId, authorId, readingTimeAr, readingTimeEn (auto-calculated), status, publishedAt, seo. Many-to-many with Category and Tag.
7. **Category**: name (localized), slugAr, slugEn, type (`POST`, `PROJECT`).
8. **Tag**: name (localized), slugAr, slugEn.
9. **Testimonial**: clientName, role (localized), company, photoId, quote (localized), rating (1–5), order, isVisible.
10. **TeamMember**: name (localized), role (localized), team (`BRAND`, `MARKETING`, `DEVELOPMENT`), photoId, bio (localized), socials (JSON), order, isVisible.
11. **Client**: name, logoId, website, order, isVisible.
12. **QuoteRequest**: services (enum[]), projectDetails, budgetRange (enum), timeline (enum), name, email, phone, company, locale, status (`NEW`, `CONTACTED`, `IN_PROGRESS`, `WON`, `LOST`), internalNotes, assignedToId, ipHash, userAgent.
13. **ContactMessage**: name, email, phone, message, locale, status (`NEW`, `REPLIED`, `ARCHIVED`), ipHash.
14. **SiteSettings** (singleton): companyName, logoId, contact (JSON: phone, email, whatsapp, address localized), socials (JSON), defaultSeo (JSON), homepage (JSON: hero, stats, processSteps, featuredProjectIds, CTA texts, all localized).
15. **AuditLog**: actorId, action (`CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGIN_FAILED`, `STATUS_CHANGE`...), entity, entityId, changes (JSON diff, never secrets), ipHash, createdAt. Indexed on entity + entityId and on createdAt.

## 3. Indexes and Performance
- Indexes on: all slugs, `status + publishedAt` (posts, projects), `featured`, `category`, `order`, lead `status + createdAt`, foreign keys.
- Use `onDelete` rules deliberately (e.g., Media in use: `Restrict`; tokens: `Cascade` on user delete).
- Use the Neon **pooled** connection string for the app and the direct one for migrations (`directUrl`).

## 4. Privacy
- Store `ipHash` (SHA-256 of IP + secret salt), never raw IPs.
- Only store the PII fields that the forms need.

## 5. Shared zod Schemas (`packages/shared/src/schemas`)
For every entity: `createXSchema`, `updateXSchema` (partial), `xQuerySchema` (pagination + filters + sort), plus public form schemas:
- `contactFormSchema`: strict lengths (name 2–80, message 10–2000), email, optional phone (E.164-friendly).
- `quoteFormSchema`: split into step schemas (`quoteStep1Schema`, `quoteStep2Schema`, `quoteStep3Schema`) and merged into a full schema.
- `paginationSchema`: `page` ≥ 1, `pageSize` between 1 and 50 (default 12).
- Error messages are i18n keys (e.g., `"validation.email.invalid"`), not hard-coded text.

## 6. Prisma Client and Repositories Setup
- Singleton Prisma client in `apps/api/src/lib/prisma.ts` with logging tied to the logger (queries only in dev).
- A base pattern for repositories (no business logic inside).

## 7. Seed Script
- Idempotent (safe to run multiple times, uses upsert).
- 1 admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env (argon2id hash). Refuse to run with a weak password.
- 3 services (Development, Branding, Marketing) with realistic sub-services (Development includes: E-commerce, E-learning, ERP, CRM, Salla, Shopify, WordPress, AI Agents, n8n Automation).
- 6 projects across categories, 3 blog posts, categories and tags, 4 testimonials, 6 team members (2 per team), 8 clients, full SiteSettings with homepage content.
- All content in natural Arabic and professional English. Use placeholders like `[Client Name]` where real data is needed.
- Placeholder images: reference stable placeholder URLs, clearly marked for replacement.

## Acceptance Criteria
- [ ] `pnpm db:migrate` creates the schema from scratch without errors
- [ ] `pnpm db:seed` runs twice without duplicates or errors
- [ ] Prisma Studio shows all seeded data in both languages
- [ ] Unit tests for the shared zod schemas (valid and invalid cases)
- [ ] All quality gates pass
