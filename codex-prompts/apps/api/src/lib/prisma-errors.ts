import { Prisma } from '@/generated/prisma/client.js';
import { type AppError, ConflictError, NotFoundError, ValidationError } from '@/lib/errors.js';

/**
 * Known Prisma error codes that reflect client input, not bugs:
 * unique violation, foreign key in use, record not found, value too long.
 */
const CLIENT_ERRORS: Partial<Record<string, () => AppError>> = {
  P2002: () => new ConflictError(),
  P2003: () => new ConflictError(),
  P2025: () => new NotFoundError(),
  P2000: () => new ValidationError(),
};

/** Maps a Prisma error caused by client input to an AppError; anything else stays unknown. */
export function fromPrismaError(error: unknown): AppError | undefined {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return undefined;
  return CLIENT_ERRORS[error.code]?.();
}
