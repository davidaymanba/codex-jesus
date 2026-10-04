import type { Pagination, PaginationMeta } from '@codex/shared';

/** Converts a validated page request into Prisma `skip`/`take`. */
export function toPageArgs({ page, pageSize }: Pagination): { skip: number; take: number } {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

/** Builds the `meta` block of a paginated response. */
export function toPaginationMeta(total: number, { page, pageSize }: Pagination): PaginationMeta {
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}

/**
 * Everything a paginated list needs from one validated query: Prisma `skip`/`take`, and a
 * function building the response `meta` once the total is known.
 */
export function paginate(query: Pagination): {
  skip: number;
  take: number;
  toMeta: (total: number) => PaginationMeta;
} {
  return { ...toPageArgs(query), toMeta: (total) => toPaginationMeta(total, query) };
}
