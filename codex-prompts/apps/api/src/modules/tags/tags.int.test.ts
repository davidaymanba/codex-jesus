import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { adminTagDtoSchema } from '@codex/shared';

import { ownerDb } from '@/test/integration/database.js';
import { adminCall, app, dataOf, signInAs } from '@/test/integration/http.js';

describe('admin tags', () => {
  it('requires a session', async () => {
    expect((await request(app).get('/api/v1/admin/tags')).status).toBe(401);
  });

  it('creates, updates with an audited diff, and deletes', async () => {
    const jar = await signInAs('EDITOR');
    const created = await adminCall('post', '/admin/tags', jar).send({
      name: { ar: 'سلة', en: 'Salla' },
    });
    const { id, slugAr, slugEn } = dataOf(created, adminTagDtoSchema);
    expect([created.status, slugAr, slugEn]).toEqual([201, 'سلة', 'salla']);

    const renamed = await adminCall('patch', `/admin/tags/${id}`, jar).send({
      slugEn: 'salla-stores',
    });
    expect(dataOf(renamed, adminTagDtoSchema).slugEn).toBe('salla-stores');

    expect((await adminCall('delete', `/admin/tags/${id}`, jar)).status).toBe(204);
    const actions = await ownerDb.auditLog.findMany({
      where: { entity: 'TAG' },
      orderBy: { createdAt: 'asc' },
      select: { action: true },
    });
    expect(actions.map(({ action }) => action)).toEqual(['CREATE', 'UPDATE', 'DELETE']);
  });
});
