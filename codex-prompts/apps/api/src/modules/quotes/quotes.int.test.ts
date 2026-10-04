import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { quoteRequestDtoSchema } from '@codex/shared';

import { createUser, ownerDb } from '@/test/integration/database.js';
import { createQuoteRow } from '@/test/integration/fixtures.js';
import { adminCall, app, dataOf, signInAs } from '@/test/integration/http.js';

describe('admin quote requests', () => {
  it('filters by status, service, date and search; never exposes ipHash', async () => {
    const jar = await signInAs('EDITOR');
    await createQuoteRow({ name: 'Nora', services: ['SEO'], status: 'CONTACTED' });
    await createQuoteRow();

    const byStatus = await adminCall('get', '/admin/quotes?status=CONTACTED', jar);
    const byService = await adminCall('get', '/admin/quotes?service=ECOMMERCE', jar);
    const bySearch = await adminCall('get', '/admin/quotes?q=nor', jar);
    const future = await adminCall(
      'get',
      `/admin/quotes?from=${new Date(Date.now() + 60_000).toISOString()}`,
      jar,
    );

    const list = z.array(quoteRequestDtoSchema);
    expect(dataOf(byStatus, list).map((quote) => quote.name)).toEqual(['Nora']);
    expect(dataOf(byService, list).map((quote) => quote.name)).toEqual(['Lead Person']);
    expect(dataOf(bySearch, list)).toHaveLength(1);
    expect(dataOf(future, list)).toHaveLength(0);
    expect(byStatus.text).not.toMatch(/ipHash|userAgent/);
  });

  it('changes status, assigns an active user and keeps notes, all audited', async () => {
    const jar = await signInAs();
    const assignee = await createUser({ role: 'EDITOR', email: 'sales@codex.example' });
    const inactive = await createUser({
      role: 'EDITOR',
      email: 'gone@codex.example',
      isActive: false,
    });
    const { id } = await createQuoteRow();

    const updated = await adminCall('patch', `/admin/quotes/${id}`, jar).send({
      status: 'IN_PROGRESS',
      assignedToId: assignee.id,
      internalNotes: 'Call on Sunday',
    });
    const toInactive = await adminCall('patch', `/admin/quotes/${id}`, jar).send({
      assignedToId: inactive.id,
    });

    expect(dataOf(updated, quoteRequestDtoSchema)).toMatchObject({
      status: 'IN_PROGRESS',
      assignedTo: { id: assignee.id, name: 'Test User' },
      internalNotes: 'Call on Sunday',
    });
    expect(toInactive.status).toBe(400);
    const audit = await ownerDb.auditLog.findFirstOrThrow({ where: { entity: 'QUOTE_REQUEST' } });
    expect(audit.action).toBe('STATUS_CHANGE');
  });

  it('exports CSV with injection characters escaped, and audits the export', async () => {
    const jar = await signInAs();
    await createQuoteRow({
      name: '=HYPERLINK("http://evil.example")',
      company: '@SUM(A1)',
      phone: '+966500000000',
    });

    const response = await adminCall('get', '/admin/quotes/export.csv', jar).buffer(true);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(response.headers['content-disposition']).toMatch(
      /attachment; filename="quote-requests-/,
    );
    expect(response.text).toContain(`"'=HYPERLINK(""http://evil.example"")"`);
    expect(response.text).toContain(`"'@SUM(A1)"`);
    expect(response.text).toContain(`"'+966500000000"`);
    const audit = await ownerDb.auditLog.findFirstOrThrow({ where: { action: 'EXPORT' } });
    expect(audit.changes).toMatchObject({ rows: 1 });
  });

  it('requires lead permissions (anonymous 401)', async () => {
    expect((await request(app).get('/api/v1/admin/quotes/export.csv')).status).toBe(401);
  });
});
