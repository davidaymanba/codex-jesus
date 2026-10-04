import { createPrivateKey, createPublicKey, randomUUID } from 'node:crypto';

import { errors as joseErrors, jwtVerify, SignJWT } from 'jose';
import { z } from 'zod';

import { AUTH_TOKEN_TTL, type Role, roleSchema } from '@codex/shared';

import { env } from '@/config/env.js';
import { UnauthorizedError } from '@/lib/errors.js';

const ALGORITHM = 'EdDSA';
const CLOCK_TOLERANCE_SECONDS = 5;

const privateKey = createPrivateKey(Buffer.from(env.JWT_PRIVATE_KEY, 'base64').toString('utf8'));
const publicKey = createPublicKey(privateKey);

const claimsSchema = z.object({
  sub: z.uuid(),
  sid: z.uuid(),
  role: roleSchema,
  /** Credentials version: the password-change time (ms) the token was issued under. */
  cv: z.number().int().nonnegative(),
});

export type AccessTokenClaims = z.infer<typeof claimsSchema>;

/** Access-token subject: who, with which role, in which session, under which password. */
export interface AccessTokenSubject {
  userId: string;
  role: Role;
  sessionId: string;
  /** `passwordChangedAt` in ms (0 when never changed); see `credentialsVersionOf`. */
  credentialsVersion: number;
}

/** The credentials version of a user: tokens issued under an older password stop working. */
export function credentialsVersionOf(passwordChangedAt: Date | null): number {
  return passwordChangedAt?.getTime() ?? 0;
}

/**
 * Signs a 15-minute EdDSA access token with `iss`, `aud`, `sub`, `role`, `sid`, `cv` and `jti`.
 */
export function signAccessToken({
  userId,
  role,
  sessionId,
  credentialsVersion,
}: AccessTokenSubject): Promise<string> {
  return new SignJWT({ role, sid: sessionId, cv: credentialsVersion })
    .setProtectedHeader({ alg: ALGORITHM, typ: 'JWT' })
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setSubject(userId)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${AUTH_TOKEN_TTL.ACCESS_SECONDS}s`)
    .sign(privateKey);
}

/**
 * Verifies signature, algorithm (EdDSA only: no `alg` confusion), issuer, audience and expiry.
 * Any failure is a plain 401; the reason is not revealed.
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  try {
    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: [ALGORITHM],
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      clockTolerance: CLOCK_TOLERANCE_SECONDS,
      requiredClaims: ['sub', 'jti', 'iat', 'exp'],
    });
    return claimsSchema.parse(payload);
  } catch (error) {
    if (error instanceof joseErrors.JOSEError || error instanceof z.ZodError) {
      throw new UnauthorizedError();
    }
    throw error;
  }
}
