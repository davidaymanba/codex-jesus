# Phase 2: Backend Core (Security, Auth, Infrastructure)

> Read `CLAUDE.md` first. Present your plan and wait for approval.

## Goal
A hardened Express core: middleware pipeline, error handling, logging, authentication, authorization, and API docs. Every feature module in Phase 3 builds on this.

## 1. Middleware Pipeline (in this order)
1. `requestId`: generate or propagate `X-Request-Id`.
2. `pino-http` logger: structured JSON; redact `authorization`, `cookie`, `password`, `token`, email/phone in bodies.
3. `helmet`: strict config (API serves JSON only).
4. `cors`: allow-list from env (`FRONTEND_URL`), `credentials: true`.
5. `compression`.
6. Body parsers with size limits (`json` 100kb; uploads handled separately).
7. `cookie-parser`.
8. Global rate limiter (Redis store) with a sensible default.
9. Routes (`/api/v1/...`).
10. 404 handler.
11. Central error handler.

Also: `app.disable('x-powered-by')`, `trust proxy` configured correctly for Railway.

## 2. Error Handling
- `AppError` base class (statusCode, code, message, details, isOperational) plus subclasses (see `CLAUDE.md`).
- Central handler maps zod errors → 400, Prisma known errors (P2002 unique → 409, P2025 not found → 404) → proper responses.
- Production: generic message for unknown errors, no stack traces. Always include `requestId`.
- Process-level: `unhandledRejection` and `uncaughtException` are logged, then graceful exit.

## 3. Validation Middleware
- `validate({ body, params, query })` using shared zod schemas. Parsed data replaces the raw input (unknown fields stripped).

## 4. Response Helpers
- `sendSuccess(res, data, meta?)`, `sendCreated`, `sendNoContent`, `paginate(query)` utility. All responses follow the shared API shapes.

## 5. Authentication Module (`modules/auth`)
Endpoints:
- `POST /auth/login`: validate, check lockout, verify argon2id, issue tokens.
- `POST /auth/refresh`: rotate the refresh token.
- `POST /auth/logout`: revoke the current token family, clear cookies.
- `GET /auth/me`: current user (safe fields only).
- `POST /auth/change-password`: requires the current password; revokes all other sessions.

Rules:
- Access token: JWT, 15 min, signed with a strong secret (HS256 with 256+ bit secret, or EdDSA), with `iss`, `aud`, `sub`, `role`, `jti` claims.
- Refresh token: random 256-bit opaque token, **stored hashed**, 7-day expiry, **rotated on every use**. If a revoked token is reused → revoke the entire family and log a security event.
- Cookies: `httpOnly`, `Secure` (prod), `SameSite=Lax`, scoped `Path` (refresh cookie path `/api/v1/auth`), `Domain` from env (to share across `codex.com` and `api.codex.com`).
- **CSRF**: double-submit token (a non-httpOnly `csrf` cookie + `X-CSRF-Token` header) required on all state-changing admin requests. Also verify the `Origin` header.
- Brute force: max 5 failed attempts → lock the account for 15 minutes; strict login rate limit per IP (e.g., 10 per 15 min) and per email.
- Timing-safe: same response and similar timing for "user not found" and "wrong password".
- Password policy: minimum 12 characters; check against a common-passwords list.
- Log `LOGIN`, `LOGIN_FAILED`, `LOGOUT`, `TOKEN_REUSE_DETECTED` to the AuditLog.

## 6. Authorization
- `requireAuth` middleware (verifies the access token from the cookie).
- `requireRole(...roles)`: deny by default.
- Permission matrix: ADMIN = everything; EDITOR = content CRUD + leads read/update; only ADMIN manages users and settings.

## 7. Redis Layer
- Redis client with reconnect strategy and graceful degradation (if Redis is down, the API still works without cache; rate limiting falls back to memory with a logged warning).
- Cache utility: `cache.get/set/wrap(key, ttl, fn)` plus **tag-based invalidation** (`invalidateTags(['posts'])`).

## 8. Audit Logging Service
- `auditLog.record({ actorId, action, entity, entityId, changes })`. Never includes secrets. Called from services.

## 9. API Documentation
- OpenAPI 3 generated from zod schemas (e.g., `@asteasolutions/zod-to-openapi`).
- Swagger UI at `/api/docs`, **disabled in production** unless protected by basic auth from env.

## 10. Graceful Shutdown and Health
- On SIGTERM/SIGINT: stop accepting connections, finish in-flight requests (with a timeout), close Prisma and Redis.
- `GET /health` (liveness) and `GET /health/ready` (checks DB + Redis).

## 11. Tests (Vitest + Supertest)
- Auth: login success, wrong password, lockout after 5 attempts, refresh rotation, refresh reuse detection revokes the family, logout, CSRF rejection, `me` without a token → 401.
- RBAC: an editor is denied an admin-only route.
- Error handler: validation error shape, 404 shape, no stack trace in production mode.
- Use a separate test database (Docker) with reset between suites.

## Acceptance Criteria
- [ ] All endpoints documented in Swagger
- [ ] Security headers verified (show the response headers)
- [ ] All auth tests pass
- [ ] No secrets or PII appear in logs (demonstrate with a sample login log)
- [ ] All quality gates pass
