import type { Request } from 'express';

import { getAuth } from './auth.middleware.js';

/** Who performs an admin write, for the audit log. */
export interface Actor {
  userId: string;
  ip: string | undefined;
}

export function actorOf(req: Request): Actor {
  return { userId: getAuth(req).userId, ip: req.ip };
}
