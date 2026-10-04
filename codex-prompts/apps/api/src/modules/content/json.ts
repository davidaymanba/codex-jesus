import type { z } from 'zod';

import type { Prisma } from '@/generated/prisma/client.js';

/**
 * Reads a JSON column through its DTO schema. Prisma cannot type JSONB; every write path
 * validates these columns with the shared zod schemas, so a failure here means corrupt data
 * and surfaces as a 500 instead of a malformed response. Mapping runs on cache misses only.
 */
export function parseJson<TSchema extends z.ZodType>(
  schema: TSchema,
  value: Prisma.JsonValue,
): z.output<TSchema> {
  return schema.parse(value);
}
