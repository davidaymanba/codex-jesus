# Phase 4: Frontend Foundation (Design System, Layout, i18n, Security)

> Read `CLAUDE.md` first. Present your plan and wait for approval.

## Goal
A polished, performant, secure frontend foundation: brand design system, bilingual routing, layout, API client, and base SEO. Public pages (Phase 5) and the admin (Phase 6) build on this.

## 1. Folder Structure (`apps/web/src`)
```
app/
├─ [locale]/
│  ├─ (site)/          # public pages (Phase 5)
│  ├─ layout.tsx
│  └─ not-found.tsx
├─ admin/              # Phase 6
├─ api/revalidate/route.ts
├─ sitemap.ts, robots.ts
components/
├─ ui/                 # shadcn primitives (customized to brand)
├─ layout/             # Header, Footer, MobileMenu, LanguageSwitcher, WhatsAppButton
├─ sections/           # page sections (Phase 5)
├─ motion/             # animation primitives
└─ shared/             # Container, Section, SectionHeading, BracketDecor...
lib/
├─ api/                # typed API client + endpoint functions
├─ seo/                # metadata + JSON-LD builders
├─ i18n/
└─ utils/
messages/ar.json, messages/en.json
styles/globals.css
```

## 2. Design Tokens and Tailwind
- All brand colors from `CLAUDE.md` as CSS variables in `globals.css`, mapped into Tailwind's theme. **No other colors.**
- Semantic tokens on top: `--bg`, `--fg`, `--muted`, `--border`, `--primary`, `--accent`, `--ring`, with two surface modes: `.surface-dark` (navy) and `.surface-light` (lavender/white), so any section can switch mode with one class.
- Type scale (fluid with `clamp()`), spacing scale, radius scale (16–24px for cards), shadow scale, container widths.
- Visible focus rings (`blue-500`) on every interactive element.

## 3. Fonts
- `next/font/local` for Neue Montreal (300/500/700) and Morrison; `next/font/google` for Rubik and Noto Sans Arabic (Arabic subset only).
- CSS variables per font; the root layout applies the English or Arabic stack based on locale.
- Preload only the fonts used above the fold; `display: swap`; tuned fallback metrics to prevent CLS.

## 4. i18n (next-intl)
- Middleware locale routing: `/ar` (default) and `/en`; detect via the `Accept-Language` header on the first visit; remember the choice in a cookie.
- `<html lang dir>` set correctly per locale.
- Typed messages (type-safe translation keys).
- `LanguageSwitcher` keeps the current page, using the localized slug for dynamic pages (fetch the alternate slug).
- Localized pathnames support (e.g., `/ar/خدمات` optional; default to English path segments for simplicity unless approved).

## 5. UI Components (brand-styled)
- `Button` (variants: primary gold, secondary blue, outline, ghost, link; sizes; loading state; `asChild`)
- `Container`, `Section` (with `surface` prop: dark/light), `SectionHeading` (eyebrow + title + description)
- `Card`, `Badge`, `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Label`, `FormField` (with error message from i18n key), `Accordion`, `Tabs`, `Dialog`, `Sheet`, `Toast`, `Skeleton`
- Decorative: `BracketDecor` (`{}` motif), `GridPattern`, `GlowGradient` (pure CSS/SVG, no images)
- All accessible: keyboard navigation, aria attributes, focus management, RTL-aware.

## 6. Motion Primitives
- `FadeIn`, `SlideUp`, `Stagger`, `Counter` (animated numbers), built on `motion` with `LazyMotion` + `domAnimation` for a small bundle.
- Trigger on viewport entry; disabled automatically with `prefers-reduced-motion`.
- Animate only `transform` and `opacity` (no layout-thrashing properties).

## 7. Layout
- **Header** (dark, sticky, blur on scroll): logo, nav (Home, Services with dropdown, Portfolio, Blog, About, Contact), language switcher, gold "Request a Quote" CTA. Mobile: accessible sheet menu.
- **Footer** (dark): logo + short description, service links, company links, contact info, socials, newsletter placeholder, copyright, legal links.
- **Floating WhatsApp button** (number from settings, prefilled localized message).
- Skip-to-content link.
- Site settings fetched once on the server and cached (tag `settings`).

## 8. API Client (`lib/api`)
- Typed `apiFetch<T>()` wrapper using shared response types; validates responses with zod in development.
- Server-side fetching with caching and tags using the caching APIs of the installed Next.js version (fetch `next: { tags, revalidate }` + `revalidateTag`, or `"use cache"` + `cacheTag` if available and stable).
- Timeouts, typed errors, and graceful fallbacks (a page must not crash if a non-critical section fails).
- The server-only module is marked `server-only`.

## 9. Revalidation Route (`app/api/revalidate/route.ts`)
- Verify the HMAC signature + timestamp (constant-time comparison). Reject if invalid or older than 5 minutes.
- Revalidate the received tags. Return minimal responses.

## 10. Security Headers (web)
- In middleware: a **nonce-based CSP** (script-src with nonce + `strict-dynamic`; allow only required domains: Cloudinary images, Turnstile, the API, Sentry).
- HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera, microphone, geolocation disabled), `frame-ancestors 'none'`.
- `poweredByHeader: false`. Images only from allowed remote patterns.

## 11. SEO Foundation (`lib/seo`)
- `buildMetadata({ title, description, path, locale, image })` returning title template, description, canonical, `hreflang` alternates (`ar`, `en`, `x-default`), Open Graph, and Twitter cards.
- JSON-LD builders: `Organization`, `WebSite`, `BreadcrumbList`, `Article`, `Service`, `FAQPage`.
- Default OG image generated with `next/og` in brand style (per locale).
- `robots.ts` (disallow `/admin` and `/api`), `sitemap.ts` (base; dynamic entries added in Phase 5).

## 12. Error Pages
- Branded `not-found.tsx` (404) and `error.tsx` (with retry), both localized.

## 13. Temporary UI Showcase
- A `/[locale]/dev/ui` page (development only, excluded from production build or blocked) showing all components in both surfaces and both directions, for review.

## Acceptance Criteria
- [ ] UI showcase looks correct in `ar` RTL and `en` LTR, on mobile and desktop
- [ ] Header, footer, mobile menu, and language switcher work
- [ ] CSP active without console violations (show the header)
- [ ] Revalidation route rejects invalid signatures (tested)
- [ ] Lighthouse on the showcase page: Accessibility ≥ 95, Best Practices = 100
- [ ] All quality gates pass
