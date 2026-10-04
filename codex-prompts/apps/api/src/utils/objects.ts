/** `T` without explicit `undefined` values: what Prisma accepts under exactOptionalPropertyTypes. */
export type Defined<T> = { [K in keyof T]?: Exclude<T[K], undefined> };

/**
 * Drops keys whose value is `undefined`. zod's partial (PATCH) schemas type omitted fields
 * as `undefined`, which Prisma's update inputs reject; the runtime value is the same object.
 */
export function withoutUndefined<T extends object>(value: T): Defined<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as Defined<T>;
}
