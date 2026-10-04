import type { Response } from 'express';

/** Headers of a CSV download; the date keeps repeated exports apart. */
export function startCsvDownload(res: Response, name: string): void {
  const date = new Date().toISOString().slice(0, 10);
  res.status(200);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${name}-${date}.csv"`);
}
