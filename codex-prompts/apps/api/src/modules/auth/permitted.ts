import { hasPermission, type Permission } from '@codex/shared';

import { ForbiddenError } from '@/lib/errors.js';
import { validate, type RequestSchemas, type ValidatedHandler } from '@/middleware/validate.js';

import { getAuth } from './auth.middleware.js';

/**
 * Checks the permission first (deny by default: no validation details leak to roles without
 * access), then validates like `validate(schemas)`. One handler, so the route's later
 * handlers are typed with the parsed params, body and query.
 */
export function permitted<TSchemas extends RequestSchemas>(
  permission: Permission,
  schemas: TSchemas = {} as TSchemas,
): ValidatedHandler<TSchemas> {
  const validateRequest = validate(schemas);
  return (req, res, next) => {
    if (!hasPermission(getAuth(req).role, permission)) throw new ForbiddenError();
    validateRequest(req, res, next);
  };
}
