/**
 * Length and size limits for every user-editable field (CLAUDE.md §8: every string is bounded).
 * The Prisma schema mirrors the string limits as VARCHAR sizes.
 */
export const FIELD_LIMITS = {
  PERSON_NAME: { MIN: 2, MAX: 80 },
  EMAIL_MAX: 254,
  /** E.164: "+" and up to 15 digits. */
  PHONE_MAX: 16,
  COMPANY_MAX: 120,
  CLIENT_NAME_MAX: 120,
  TITLE_MAX: 160,
  LABEL_MAX: 80,
  SHORT_LABEL_MAX: 40,
  SHORT_TEXT_MAX: 300,
  QUOTE_MAX: 600,
  BIO_MAX: 1000,
  LONG_TEXT_MAX: 2000,
  SLUG_MAX: 120,
  URL_MAX: 2048,
  PATH_MAX: 200,
  ICON_MAX: 64,
  /** Shorter terms cannot use a trigram index and match almost everything anyway. */
  SEARCH_QUERY: { MIN: 2, MAX: 100 },
  SEO_TITLE_MAX: 70,
  SEO_DESCRIPTION_MAX: 160,
  ALT_TEXT_MAX: 200,
  CONTACT_MESSAGE: { MIN: 10, MAX: 2000 },
  QUOTE_DETAILS: { MIN: 20, MAX: 3000 },
  INTERNAL_NOTES_MAX: 5000,
  PASSWORD: { MIN: 12, MAX: 128 },
  TECH_STACK: { ITEM_MAX: 40, MAX_ITEMS: 30 },
  RATING: { MIN: 1, MAX: 5 },
  ORDER_MAX: 10_000,
  STAT_VALUE_MAX: 1_000_000,
  STAT_SUFFIX_MAX: 4,
  /** Max items in repeatable content blocks (sub-services, FAQs, results…). */
  LIST_MAX_ITEMS: 20,
  RELATION_MAX_ITEMS: 10,
  GALLERY_MAX_ITEMS: 30,
  SOCIALS_MAX_ITEMS: 10,
  FEATURED_PROJECTS_MAX: 6,
  HOMEPAGE_STATS_MAX: 6,
  PROCESS_STEPS_MAX: 8,
  /** Items one reorder request may arrange. */
  REORDER_MAX_ITEMS: 500,
  /** Opaque tokens from links (password reset) and bot checks (Turnstile). */
  OPAQUE_TOKEN_MAX: 2048,
  /** Honeypot field: bots fill it with anything; bounded so the check stays cheap. */
  HONEYPOT_MAX: 500,
} as const;
