# Phase 6: Admin Dashboard

> Read `CLAUDE.md` first. Present your plan and wait for approval.

## Goal
A secure, fast, easy-to-use admin dashboard at `/admin` to manage all content and leads, in Arabic and English.

## 1. Security (first priority)
- `/admin/*` is protected by middleware: no valid session → redirect to `/admin/login`.
- Authorization is **always enforced by the API**; the frontend guard is for UX only.
- `noindex, nofollow` meta + `X-Robots-Tag` header; excluded from the sitemap; disallowed in robots.
- All mutations send the CSRF token header. Credentials sent with `credentials: 'include'`.
- Automatic silent token refresh (single in-flight refresh request shared by concurrent calls); on refresh failure → logout.
- Idle timeout: auto-logout after 30 minutes of inactivity with a warning dialog 1 minute before.
- Hide UI actions the current role cannot perform (EDITOR cannot see Users, Settings, or Audit Log).
- Confirmation dialogs for destructive actions (delete, deactivate).

## 2. Tech
- Client components with **TanStack Query** (queries + mutations, optimistic updates where safe, cache invalidation) and **TanStack Table** (server-side pagination, sorting, filtering).
- Forms: react-hook-form + shared zod schemas (the same schemas the API uses).
- The admin bundle is fully separate from the public site bundle (it must not affect public page performance).

## 3. Layout
- Sidebar navigation (collapsible; sheet on mobile) with icons and "new" badges on Leads and Messages.
- Top bar: breadcrumbs, admin language switch (ar/en with RTL/LTR), current user menu (profile, change password, logout).
- Branded with Codex colors and logo; clean, professional, data-dense but readable.
- Toast notifications for success and errors (error messages mapped from API error codes to i18n keys).

## 4. Pages
1. **Login**: email + password, loading state, lockout message, no account enumeration in error messages.
2. **Dashboard**: stat cards (new quote requests, new messages, published posts, published projects), leads-per-month chart (last 12 months, lightweight chart library, dynamically imported), latest 5 leads with quick status change.
3. **Content modules**: Services, Projects, Posts, Categories, Tags, Testimonials, Team, Clients:
   - List: data table with search, filters (status, category), sort, pagination, bulk actions (publish, unpublish, delete) where relevant.
   - Create/Edit form:
     - **Arabic / English tabs** side by side for every localized field, with an indicator on a tab if it has errors or missing content.
     - Auto slug with manual override.
     - **Rich text editor (Tiptap)**: headings, bold, italic, lists, links, quotes, code blocks, images from the media library, tables; RTL/LTR per language tab; only the node types allowed by the API.
     - Image fields use the media picker.
     - SEO panel (meta title/description with character counters, OG image) + a Google search preview.
     - Status (draft/published), publish date (scheduling), featured toggle.
     - **Unsaved changes warning** when leaving the page.
     - **Preview** button opens the draft on the site via a secure, short-lived signed preview token.
   - Drag-and-drop reordering for ordered lists (accessible keyboard alternative).
4. **Media Library**: grid view, upload with drag and drop (client-side type and size check before upload, progress bar), alt text editing (ar/en), search, delete (shows usage if blocked), copy URL.
5. **Quote Requests**: table with status tabs (New, Contacted, In Progress, Won, Lost), filters (service, date range), detail drawer with all info, status change, assign to user, internal notes, quick actions (email, WhatsApp, call links), CSV export.
6. **Contact Messages**: same pattern (New, Replied, Archived).
7. **Site Settings** (ADMIN): company info, contact info, socials, default SEO, homepage content editor (hero texts, stats numbers, process steps, featured projects picker), all bilingual.
8. **Users** (ADMIN): list, invite/create, change role, deactivate, reset password.
9. **Audit Log** (ADMIN): filterable table (actor, action, entity, date) with change details.
10. **Profile**: update name, change password (with strength meter).

## 5. UX Details
- Skeleton loaders, empty states with a clear call to action, error states with retry.
- Keyboard shortcuts: `Ctrl/Cmd + S` to save, `/` to focus search.
- Fully responsive (usable on tablet and phone).

## 6. Tests
- Component tests for key forms (validation, tab error indicators).
- Playwright E2E: login → create a post in both languages → publish → verify it appears on the public site → logout. Also: an editor cannot access the Users page.

## Acceptance Criteria
- [ ] Full CRUD works for every module in both languages
- [ ] Leads workflow works end-to-end (form submission → appears in admin → status change → audit log entry)
- [ ] Session refresh, idle timeout, and logout work correctly
- [ ] Public site bundle size unchanged after adding the admin (show the before and after)
- [ ] E2E tests pass; all quality gates pass
