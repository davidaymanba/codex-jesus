import type { SortOrder } from '@codex/shared';

/**
 * Prisma `orderBy` from an allow-listed sort (the shared query schemas restrict `sortBy`),
 * with `id` as a tie-breaker so pages never overlap when sort values repeat.
 */
export function orderByOf<TField extends string>(
  sortBy: TField,
  sortOrder: SortOrder,
): [Partial<Record<TField, SortOrder>>, { id: SortOrder }] {
  // A computed key widens to `string`; `sortBy` is one of TField by construction.
  const primary = { [sortBy]: sortOrder } as Partial<Record<TField, SortOrder>>;
  return [primary, { id: sortOrder }];
}
