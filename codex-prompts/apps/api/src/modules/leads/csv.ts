import type { Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

// Spreadsheet apps run cells starting with these as formulas (OWASP "CSV injection"); tab and
// carriage return can also start one after the app trims the cell.
const FORMULA_TRIGGERS = /^[=+\-@\t\r]/;
// Excel needs a BOM to read UTF-8 (Arabic) correctly.
const UTF8_BOM = '﻿';
const LINE_END = '\r\n';

/** One CSV cell: neutralizes formulas with a leading `'`, then quotes per RFC 4180. */
export function toCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const text = String(value);
  const safe = FORMULA_TRIGGERS.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export const toCsvRow = (cells: readonly (string | number | boolean | null | undefined)[]) =>
  cells.map(toCsvCell).join(',') + LINE_END;

/**
 * Streams a CSV document: header, then each batch as it arrives, honoring backpressure so a
 * large export never buffers in memory. Returns the number of data rows written. If the
 * client goes away, no further batch is read and the promise rejects (it never hangs on a
 * `drain` that cannot come). `out` is left open for the caller to end.
 */
export async function streamCsv<TRow>(
  out: Writable,
  header: readonly string[],
  batches: AsyncIterable<readonly TRow[]> | Iterable<readonly TRow[]>,
  toCells: (row: TRow) => readonly (string | number | boolean | null | undefined)[],
): Promise<number> {
  let rows = 0;
  async function* chunks() {
    yield UTF8_BOM + toCsvRow(header);
    for await (const batch of batches) {
      yield batch.map((row) => toCsvRow(toCells(row))).join('');
      rows += batch.length;
    }
  }
  await pipeline(chunks, out, { end: false });
  return rows;
}
