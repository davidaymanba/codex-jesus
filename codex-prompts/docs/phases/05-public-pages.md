# Phase 5: Public Website Pages

> Read `CLAUDE.md` first. Present your plan (page by page, sections list) and wait for approval.
> Build one page at a time and show it to me before moving to the next.

## Goal
All public pages, beautifully designed in the brand style, bilingual, fully connected to the API, with top-tier performance and SEO.

## Global Rules for Every Page
- Server Components; data fetched on the server with cache tags; statically generated or ISR (`generateStaticParams` for dynamic routes).
- Every page has: `generateMetadata` (localized, canonical, hreflang, OG), JSON-LD where relevant, breadcrumbs (except home), and one clear `h1`.
- Sections alternate dark and light surfaces.
- Only the LCP image uses `priority`; all other images lazy-load with correct `sizes`.
- Client components only for: forms, sliders, filters, menus, animations.
- Graceful empty states (e.g., no posts yet).
- Persuasive, professional copy in both languages (all texts in message files or from the CMS).

## 1. Home (`/[locale]`)
1. **Hero** (dark): bold headline about building digital products, brands, and growth; supporting line; CTAs "Request a Quote" (gold) and "View Our Work" (outline); blue gradient glow + faint grid + `{}` motif; a code-inspired visual built in CSS/SVG (no heavy images). Must be the fastest-loading part of the site.
2. **Clients strip** (light): client logos, subtle infinite marquee (CSS-only, paused on hover and for reduced motion).
3. **Three pillars** (light): Development, Branding, Marketing as large cards with icon, short description, and link to the service page.
4. **Development expertise** (dark): grid of solutions (E-commerce, E-learning, ERP, CRM, Salla, Shopify, WordPress, AI Agents, n8n Automation), each with an icon and one-line description.
5. **AI & Automation highlight** (dark, visually special): explains AI agents and n8n automation, with an animated workflow-style diagram built in SVG (nodes connected by lines, light pulse animation).
6. **Stats** (light): animated counters (projects, clients, years, team members) from settings.
7. **Our Teams** (light): Brand, Marketing, and Development teams with what each team does.
8. **Featured projects** (dark): 3–6 featured case studies as cards with hover effects.
9. **Process** (light): Discover → Design → Build → Launch → Grow, as a connected timeline (horizontal on desktop, vertical on mobile).
10. **Testimonials** (dark): accessible slider (keyboard + swipe, pause control).
11. **Latest blog posts** (light): 3 cards.
12. **Final CTA** (dark with gold accent): strong call to action + contact shortcuts.
- JSON-LD: `Organization` + `WebSite`.

## 2. Services
- **`/services`**: hero, the three pillars with sub-services, why Codex, process, CTA.
- **`/services/[slug]`**: hero, sub-services grid, benefits, process, related projects (by category), FAQ accordion, CTA to quote (preselects this service). JSON-LD: `Service` + `FAQPage` + `BreadcrumbList`.

## 3. Portfolio
- **`/portfolio`**: hero, filter by category (URL search params so filters are shareable and crawlable, e.g., `?category=ecommerce`), responsive grid, pagination or "load more".
- **`/portfolio/[slug]`**: hero with cover, project meta (client, industry, services, tech stack), challenge, solution, results with big metric numbers, image gallery (accessible lightbox, dynamically imported), next/previous project, CTA. JSON-LD: `CreativeWork` + `BreadcrumbList`.

## 4. Blog
- **`/blog`**: hero, featured post, category filter, search (server-side via search params), post cards (cover, category, title, excerpt, reading time, date), pagination.
- **`/blog/[slug]`**: title, meta (author, date, reading time, category), cover, content rendered from Tiptap JSON with a **safe whitelist renderer** and good typography (`prose` styles adapted for Arabic and English), auto-generated table of contents (sticky on desktop), share buttons (no third-party scripts, plain share URLs), tags, related posts, CTA. JSON-LD: `Article` + `BreadcrumbList`.
- `/blog/category/[slug]` pages (indexable).
- RSS feed per locale (`/[locale]/blog/rss.xml`).

## 5. About (`/about`)
- Story, mission and vision, values, the three teams, team members grid, stats, why choose us, CTA.

## 6. Contact (`/contact`)
- Contact form (react-hook-form + shared zod schema): name, email, phone (optional), message. Honeypot + Turnstile (loaded lazily when the form becomes visible).
- States: validation errors (localized), loading, success, failure (with retry). Double-submit prevented.
- Contact info cards (phone, email, WhatsApp, address), socials, map (static image or lazy iframe loaded on click, to protect performance and privacy).

## 7. Request a Quote (`/quote`)
- Multi-step form with a progress indicator:
  1. **Services**: multi-select cards (Development sub-types, Branding, Marketing). Preselect from the `?service=` param.
  2. **Project details**: description, budget range, timeline.
  3. **Contact info**: name, email, phone, company.
  → **Success screen** with next steps.
- Validation per step with the shared step schemas. Progress saved in `sessionStorage` (wrapped in try/catch) so a refresh does not lose data; cleared on success.
- Accessible: focus moves to the step heading on step change; errors announced with `aria-live`.

## 8. Legal Pages
- Privacy Policy and Terms (content from message files, placeholder text).

## 9. Sitemap and Feeds
- `sitemap.ts` includes all static pages + all published services, projects, posts, and categories, in both locales with `alternates`, using `updatedAt` from `/public/sitemap-data`.

## Performance Checklist (verify for every page)
- [ ] First-load JS under budget (share the build output table)
- [ ] No layout shift from fonts, images, or late-loading content
- [ ] Third-party scripts (Turnstile) load only when needed
- [ ] Lighthouse mobile: Performance ≥ 95, Accessibility ≥ 95, Best Practices = 100, SEO = 100 (share the scores per page)

## Acceptance Criteria
- [ ] All pages render correctly in `ar` and `en`, mobile and desktop
- [ ] Publishing a post in the DB (via the API) appears on the site within seconds (revalidation works)
- [ ] Contact and quote forms work end-to-end (DB record + emails)
- [ ] Structured data validated (no errors in Google's Rich Results Test format)
- [ ] All quality gates pass
