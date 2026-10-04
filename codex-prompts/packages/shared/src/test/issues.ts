import type { z } from 'zod';

/** Returns the i18n message keys of a failed parse (empty when it succeeds). */
export function issueMessages(schema: z.ZodType, input: unknown): string[] {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

/** Returns `path.join('.') => message` pairs so tests can assert which field failed. */
export function issuesByPath(schema: z.ZodType, input: unknown): Record<string, string> {
  const result = schema.safeParse(input);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join('.'), issue.message]),
  );
}
