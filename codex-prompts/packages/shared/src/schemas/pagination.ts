import { z } from 'zod';

import { boundedInt, isoDateTimeSchema, objectSchema } from './common.js';
import { PAGINATION } from '../constants/pagination.js';
import { VALIDATION_MESSAGES as MSG } from '../constants/validation-messages.js';

export const SORT_ORDERS = ['asc', 'desc'] as const;

export type SortOrder = (typeof SORT_ORDERS)[number];

/** `page` 1–1000 and `pageSize` 1–50 (default 12), coerced from query strings. */
export const paginationSchema = objectSchema({
  page: boundedInt({ min: 1, max: PAGINATION.MAX_PAGE, coerce: true }).default(
    PAGINATION.DEFAULT_PAGE,
  ),
  pageSize: boundedInt({ min: 1, max: PAGINATION.MAX_PAGE_SIZE, coerce: true }).default(
    PAGINATION.DEFAULT_PAGE_SIZE,
  ),
});

export type Pagination = z.infer<typeof paginationSchema>;

/**
 * Builds `{ sortBy, sortOrder }` restricted to the given fields, so clients can
 * never sort by an unindexed or private column.
 */
export function createSortSchema<const TField extends string>(
  fields: readonly [TField, ...TField[]],
  defaults: { sortBy: NoInfer<TField>; sortOrder: SortOrder },
) {
  return objectSchema({
    sortBy: z.enum(fields, { error: MSG.INVALID_OPTION }).default(defaults.sortBy),
    sortOrder: z.enum(SORT_ORDERS, { error: MSG.INVALID_OPTION }).default(defaults.sortOrder),
  });
}

/** Optional `from`/`to` ISO datetime filter fields; combine with `refineDateRange`. */
export const dateRangeFields = {
  from: isoDateTimeSchema.optional(),
  to: isoDateTimeSchema.optional(),
};

/**
 * Rejects a range whose `from` is after its `to`. Applied last because zod cannot
 * `.extend()` a refined object.
 */
export function refineDateRange(
  range: { from?: string | undefined; to?: string | undefined },
  ctx: z.RefinementCtx,
): void {
  if (range.from && range.to && Date.parse(range.from) > Date.parse(range.to)) {
    ctx.addIssue({ code: 'custom', message: MSG.INVALID_DATE_RANGE, path: ['to'] });
  }
}

/** Standalone `from`/`to` filter. */
export const dateRangeQuerySchema = objectSchema(dateRangeFields).superRefine(refineDateRange);
