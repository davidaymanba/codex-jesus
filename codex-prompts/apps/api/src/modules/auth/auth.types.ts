import type { Role } from '@codex/shared';

/** The authenticated caller, attached by `requireAuth`. */
export interface AuthContext {
  userId: string;
  /** Current role from the database (not the token), so demotions apply immediately. */
  role: Role;
  /** Refresh-token family of this login; the CSRF token is bound to it. */
  sessionId: string;
}

/** Request metadata stored with sessions and audit entries. */
export interface ClientContext {
  ip: string | undefined;
  userAgent: string | undefined;
}

// Express exposes request augmentation only through its global namespace.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- see above
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}
