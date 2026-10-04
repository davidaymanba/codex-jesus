import { PassThrough } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { streamCsv, toCsvCell } from './csv.js';

describe('toCsvCell', () => {
  it.each([
    ['=HYPERLINK("http://evil")', `"'=HYPERLINK(""http://evil"")"`],
    ['+966500000000', `"'+966500000000"`],
    ['-2+3', `"'-2+3"`],
    ['@SUM(A1)', `"'@SUM(A1)"`],
    ['\tcmd', `"'\tcmd"`],
    ['\rcmd', `"'\rcmd"`],
    ['متجر "سلة"', '"متجر ""سلة"""'],
    ['line\nbreak', '"line\nbreak"'],
  ])('escapes %j', (value, cell) => {
    expect(toCsvCell(value)).toBe(cell);
  });

  it('writes empty cells for missing values', () => {
    expect(toCsvCell(null)).toBe('""');
  });
});

describe('streamCsv', () => {
  it('writes a BOM, the header and every batch', async () => {
    const out = new PassThrough();
    const chunks: string[] = [];
    out.on('data', (chunk: Buffer) => chunks.push(chunk.toString()));
    const batches = [[{ name: 'a' }, { name: 'b' }], [{ name: '=c' }]];

    const rows = await streamCsv(out, ['name'], batches, (row) => [row.name]);

    expect(rows).toBe(3);
    expect(chunks.join('')).toBe('﻿"name"\r\n"a"\r\n"b"\r\n"\'=c"\r\n');
  });

  it('rejects and reads no more batches when the client goes away', async () => {
    // Nobody reads, so the buffer stays full until the connection drops.
    const out = new PassThrough({ highWaterMark: 1 });
    let pulled = 0;
    function* batches() {
      for (;;) {
        pulled += 1;
        yield [{ name: 'x'.repeat(64) }];
      }
    }

    const exporting = streamCsv(out, ['name'], batches(), (row) => [row.name]);
    setImmediate(() => out.destroy());

    await expect(exporting).rejects.toMatchObject({ code: 'ERR_STREAM_PREMATURE_CLOSE' });
    const pulledAtClose = pulled;
    await new Promise((resolve) => setImmediate(resolve));
    expect(pulled).toBe(pulledAtClose);
    expect(pulled).toBeLessThan(2);
  });
});
