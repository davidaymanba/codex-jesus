import { Prisma } from '@/generated/prisma/client.js';

/**
 * A zod-validated value as a Prisma JSON input. Parsed documents (e.g. `RichTextDocument`) are
 * interfaces, which TypeScript will not match to Prisma's index-signature JSON type, although
 * they are plain JSON by construction. Use in repositories only.
 */
export function toJsonInput(value: object): Prisma.InputJsonValue {
  return value;
}

/** Nullable JSON column: `null` stores SQL NULL. */
export function toNullableJsonInput(
  value: object | null,
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  return value === null ? Prisma.DbNull : toJsonInput(value);
}
