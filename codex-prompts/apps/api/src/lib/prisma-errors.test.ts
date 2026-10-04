import { describe, expect, it } from 'vitest';

import { ERROR_CODES } from '@codex/shared';

import { Prisma } from '@/generated/prisma/client.js';
import { fromPrismaError } from '@/lib/prisma-errors.js';

const knownError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('database said no', { code, clientVersion: 'test' });

describe('fromPrismaError', () => {
  it.each([
    ['P2002', 409, ERROR_CODES.CONFLICT],
    ['P2003', 409, ERROR_CODES.CONFLICT],
    ['P2025', 404, ERROR_CODES.NOT_FOUND],
    ['P2000', 400, ERROR_CODES.VALIDATION_FAILED],
  ])('maps %s to %i', (code, statusCode, errorCode) => {
    expect(fromPrismaError(knownError(code))).toMatchObject({ statusCode, code: errorCode });
  });

  it('leaves other Prisma errors and non-Prisma errors unmapped (they become 500s)', () => {
    expect(fromPrismaError(knownError('P1001'))).toBeUndefined();
    expect(fromPrismaError(new Error('P2002'))).toBeUndefined();
  });
});
