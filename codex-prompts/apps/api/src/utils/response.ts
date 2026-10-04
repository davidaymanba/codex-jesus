import type { Response } from 'express';

import type { ApiSuccess, PaginationMeta } from '@codex/shared';

/** 200 with the success envelope `{ success: true, data, meta? }`. */
export function sendSuccess(res: Response, data: unknown, meta?: PaginationMeta): void {
  const body: ApiSuccess<unknown> = { success: true, data, ...(meta && { meta }) };
  res.status(200).json(body);
}

/** 201 with the success envelope; `location` points at the new resource when it has a URL. */
export function sendCreated(res: Response, data: unknown, location?: string): void {
  if (location) res.location(location);
  const body: ApiSuccess<unknown> = { success: true, data };
  res.status(201).json(body);
}

/** 204 without a body. */
export function sendNoContent(res: Response): void {
  res.status(204).end();
}
