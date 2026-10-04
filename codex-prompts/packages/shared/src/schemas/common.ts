import { z } from 'zod';

import { FIELD_LIMITS } from '../constants/field-limits.js';
import { LOCALES } from '../constants/locales.js';
import { VALIDATION_MESSAGES as MSG } from '../constants/validation-messages.js';

const SLUG_EN_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Letters (any script, so Arabic works) and digits separated by single hyphens.
const SLUG_AR_PATTERN = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;
const INTERNAL_PATH_PATTERN = /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/;
const PHONE_SEPARATORS = /[\s\-().]/g;

/** zod `error` map: a missing value is `required`, any other wrong type is `invalidType`. */
export function requiredOrInvalidType(issue: { input: unknown }): string {
  return issue.input === undefined ? MSG.REQUIRED : MSG.INVALID_TYPE;
}

/** `z.object` whose missing / wrong-type error is an i18n key instead of zod's English text. */
export function objectSchema<TShape extends z.core.$ZodLooseShape>(shape: TShape) {
  return z.object(shape, { error: requiredOrInvalidType });
}

/** `z.array` whose missing / wrong-type error is an i18n key instead of zod's English text. */
export function arraySchema<TItem extends z.core.SomeType>(item: TItem) {
  return z.array(item, { error: requiredOrInvalidType });
}

/** Form inputs send `''` for untouched optional fields; treat it as absent. */
export function emptyToUndefined<TSchema extends z.ZodType>(schema: TSchema) {
  return z.preprocess((value) => (value === '' ? undefined : value), schema);
}

/**
 * Required, trimmed string with i18n errors and mandatory bounds.
 * `min` defaults to 1 so whitespace-only input counts as missing.
 */
export function requiredString({ min = 1, max }: { min?: number; max: number }) {
  return z
    .string({ error: requiredOrInvalidType })
    .trim()
    .min(min, { error: min === 1 ? MSG.REQUIRED : MSG.TOO_SHORT })
    .max(max, { error: MSG.TOO_LONG });
}

/** Array whose items must be unique (by value). */
export function uniqueArray<TItem extends z.ZodType>(
  item: TItem,
  { min = 0, max }: { min?: number; max: number },
) {
  return z
    .array(item, { error: requiredOrInvalidType })
    .min(min, { error: MSG.TOO_FEW_ITEMS })
    .max(max, { error: MSG.TOO_MANY_ITEMS })
    .refine((items) => new Set(items).size === items.length, { error: MSG.DUPLICATE_ITEMS });
}

/** Integer in `[min, max]`, coercing numeric strings when `coerce` is set (query strings). */
export function boundedInt({
  min,
  max,
  coerce = false,
}: {
  min: number;
  max: number;
  coerce?: boolean;
}) {
  const base = coerce
    ? z.coerce.number({ error: MSG.INVALID_TYPE })
    : z.number({ error: requiredOrInvalidType });
  return base
    .int({ error: MSG.NOT_INTEGER })
    .min(min, { error: MSG.NUMBER_TOO_SMALL })
    .max(max, { error: MSG.NUMBER_TOO_BIG });
}

export const idSchema = z.uuid({ error: MSG.INVALID_ID });

export const slugEnSchema = z
  .string({ error: requiredOrInvalidType })
  .trim()
  .toLowerCase()
  .max(FIELD_LIMITS.SLUG_MAX, { error: MSG.TOO_LONG })
  .regex(SLUG_EN_PATTERN, { error: MSG.INVALID_SLUG });

/** Arabic slugs keep Arabic letters (better for Arabic search) and may include Latin/digits. */
export const slugArSchema = z
  .string({ error: requiredOrInvalidType })
  .trim()
  .toLowerCase()
  .max(FIELD_LIMITS.SLUG_MAX, { error: MSG.TOO_LONG })
  .regex(SLUG_AR_PATTERN, { error: MSG.INVALID_SLUG });

export const emailSchema = z
  .string({ error: requiredOrInvalidType })
  .trim()
  .toLowerCase()
  .max(FIELD_LIMITS.EMAIL_MAX, { error: MSG.TOO_LONG })
  .pipe(z.email({ error: MSG.INVALID_EMAIL }));

/** Accepts common formatting ("+966 50-123 4567") and normalizes to E.164. */
export const phoneSchema = z
  .string({ error: requiredOrInvalidType })
  .trim()
  .transform((value) => value.replace(PHONE_SEPARATORS, ''))
  .pipe(z.e164({ error: MSG.INVALID_PHONE }));

export const httpUrlSchema = z
  .url({ protocol: /^https?$/, error: MSG.INVALID_URL })
  .max(FIELD_LIMITS.URL_MAX, { error: MSG.TOO_LONG });

/** Site-relative path without locale prefix (e.g. `/quote`); the UI adds `/ar` or `/en`. */
export const internalPathSchema = z
  .string({ error: requiredOrInvalidType })
  .max(FIELD_LIMITS.PATH_MAX, { error: MSG.TOO_LONG })
  .regex(INTERNAL_PATH_PATTERN, { error: MSG.INVALID_PATH });

export const isoDateTimeSchema = z.iso.datetime({ offset: true, error: MSG.INVALID_DATE });

export const localeSchema = z.enum(LOCALES, { error: MSG.INVALID_OPTION });

export const displayOrderSchema = boundedInt({ min: 0, max: FIELD_LIMITS.ORDER_MAX });

export const personNameSchema = requiredString({
  min: FIELD_LIMITS.PERSON_NAME.MIN,
  max: FIELD_LIMITS.PERSON_NAME.MAX,
});

/** Boolean filter from a query string: accepts "true"/"false"/"1"/"0" (never coerces "false" to true). */
export const booleanQuerySchema = z.stringbool({ error: MSG.INVALID_OPTION });

/** Free-text search term for list endpoints (use with `.optional()`). */
export const searchQuerySchema = requiredString({
  min: FIELD_LIMITS.SEARCH_QUERY.MIN,
  max: FIELD_LIMITS.SEARCH_QUERY.MAX,
});

/**
 * Slug filter that may be in either locale (e.g. `?category=`). The Arabic pattern already
 * accepts Latin slugs, so it covers both; the API matches `slugAr` or `slugEn`.
 */
export const anyLocaleSlugSchema = slugArSchema;
