# Phase 3: Backend Feature Modules

> Read `CLAUDE.md` first. Present your plan and wait for approval.

## Goal
All business modules: public read APIs (fast, cached), admin CRUD APIs (secure, audited), forms, emails, media, and dashboard stats.

## 1. Module Structure (repeat for every module)
```
modules/<name>/
├─ <name>.routes.ts
├─ <name>.controller.ts   # HTTP only: parse → call service → respond
├─ <name>.service.ts      # business logic, cache, audit, revalidation
├─ <name>.repository.ts   # Prisma only
├─ <name>.mapper.ts       # DB entity → public DTO (never leak internal fields)
└─ <name>.test.ts
```

## 2. Modules
Services, Projects, Posts, Categories, Tags, Testimonials, Team, Clients, Media, Settings, Quotes, Contact, Users, Dashboard, AuditLog.

## 3. Public Endpoints (no auth; published and visible content only)
- `GET /public/services`, `GET /public/services/:slug?locale=`
- `GET /public/projects?category=&featured=&page=&pageSize=`, `GET /public/projects/:slug?locale=`
- `GET /public/posts?category=&tag=&q=&page=&pageSize=`, `GET /public/posts/:slug?locale=`, `GET /public/posts/:slug/related`
- `GET /public/categories?type=`, `/public/testimonials`, `/public/team`, `/public/clients`, `/public/settings`
- `GET /public/sitemap-data` (slugs + updatedAt for the sitemap)
- `POST /public/contact`, `POST /public/quote`

Rules:
- Return **DTOs** via mappers, with only the needed fields (never `internalNotes`, author email, etc.).
- Cache every public GET in Redis (TTL 1 hour) with tags; add `Cache-Control` and `ETag` headers.
- Search (`q`) uses PostgreSQL full-text search or trigram index, parameterized (never string-concatenated).
- Slug lookups query the locale-specific slug column.

## 4. Admin Endpoints (`/admin/...`, requireAuth + RBAC + CSRF)
- Full CRUD for all content modules, with list endpoints supporting pagination, search, filter, and sort (sort fields from an allow-list only).
- **Slugs:** auto-generated from the title per locale (Arabic-safe slugify), with uniqueness handling.
- **Rich text:** accept Tiptap JSON; validate the node and mark types against an allow-list; strip anything else. Links: only `http`, `https`, `mailto`, and `tel` protocols, and add `rel="noopener noreferrer"` for external links.
- **Reading time:** calculated automatically on save for each locale.
- **Publishing:** `status` + `publishedAt`; support scheduled publishing (`publishedAt` in the future counts as not yet public).
- **Reorder** endpoints for ordered lists (services, team, testimonials, clients).
- **Leads:** list, filter by status/date/service, detail view, update status, assign a user, add internal notes, **export CSV** (escape values starting with `= + - @` to prevent CSV injection).
- **Users (ADMIN only):** list, create, update role, deactivate (never hard-delete the last admin), reset password.
- **Audit log (ADMIN only):** paginated list with filters.
- **Dashboard:** `GET /admin/dashboard/stats` returns counts (new leads, new messages, published posts and projects), the latest 5 leads, and leads per month (last 12 months) via a single optimized aggregate query.

After every write:
1. Record an AuditLog entry.
2. Invalidate the related Redis cache tags.
3. Call the frontend revalidation webhook (Section 7).

## 5. Media Module
- `POST /admin/media` (multipart, via multer memory storage): max 5 MB; allow-list `image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/svg+xml` (SVG sanitized with DOMPurify server-side or rejected).
- Verify the real type by **magic bytes** (`file-type`), not by extension or the client MIME.
- Upload to Cloudinary (folder per environment), strip EXIF metadata, store width/height.
- `DELETE /admin/media/:id` is blocked if the media is in use (return which entities use it).
- The frontend receives Cloudinary URLs; `next/image` handles optimization (configure a remote pattern).

## 6. Forms: Contact and Quote
Pipeline for `POST /public/contact` and `POST /public/quote`:
1. Strict rate limit (e.g., 5 per hour per IP).
2. Honeypot field check (silently accept but discard if filled).
3. Verify the **Cloudflare Turnstile** token server-side.
4. zod validation with shared schemas.
5. Save to DB (with `ipHash`, `locale`).
6. Send emails **asynchronously** (do not block the response; use a simple in-process queue with retry, and log failures).
7. Respond `201` with a minimal body.

## 7. Emails (`packages/emails`, React Email + Resend)
- Templates (branded with Codex colors and logo, RTL for Arabic):
  - `NewLeadNotification` (to the company; includes a link to the lead in the admin)
  - `QuoteConfirmation` (to the client, in their locale)
  - `ContactConfirmation` (to the client, in their locale)
  - `PasswordReset` (for admin users)
- Plain-text versions included. All user input HTML-escaped in templates.

## 8. Frontend Revalidation Webhook
- A service that `POST`s to `${FRONTEND_URL}/api/revalidate` with the affected tags (e.g., `['posts', 'post:<slug>']`).
- Signed with HMAC-SHA256 (`REVALIDATE_SECRET`) + timestamp header, rejecting requests older than 5 minutes (replay protection).
- Fire-and-forget with retry; failures are logged but never break the admin write.

## 9. Tests
- Public endpoints: only published content returned, pagination, filters, caching (second call hits the cache), no internal fields leaked.
- Admin CRUD: auth required, RBAC enforced, validation errors, audit log written, cache invalidated.
- Forms: rate limit, honeypot, invalid Turnstile rejected, successful submission saves and queues emails.
- Media: rejects a fake image (wrong magic bytes) and oversized files.
- CSV export: injection characters are escaped.
- Target: ≥ 80% coverage on services.

## Acceptance Criteria
- [ ] All endpoints in Swagger with request and response schemas
- [ ] Cached public endpoint p95 < 100ms locally (show a quick benchmark with `autocannon`)
- [ ] No N+1 queries (show the query logs for list endpoints)
- [ ] All tests pass; all quality gates pass
