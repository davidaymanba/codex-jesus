// Backslash is PostgreSQL's default LIKE escape character.
const LIKE_WILDCARDS = /[\\%_]/g;

/**
 * Escapes LIKE wildcards in a search term. Prisma's `contains` / `string_contains` bind the
 * value (no injection) but still read `%` and `_` in it as patterns.
 */
export function escapeLike(term: string): string {
  return term.replace(LIKE_WILDCARDS, '\\$&');
}
