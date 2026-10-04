import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  adminCategoryDtoSchema,
  categoryDtoSchema,
  ERROR_CODES,
  type ApiError,
} from '@codex/shared';

import { ownerDb } from '@/test/integration/database.js';
import { createCategoryRow, postBody } from '@/test/integration/fixtures.js';
import { adminCall, app, dataOf, signInAs } from '@/test/integration/http.js';

const errorOf = (body: unknown) => (body as ApiError).error;
const NAME = { ar: 'التجارة الإلكترونيَّة', en: 'E-commerce' };

async function createCategory(jar: Awaited<ReturnType<typeof signInAs>>, body: object = {}) {
  return adminCall('post', '/admin/categories', jar).send({ name: NAME, type: 'PROJECT', ...body });
}

describe('admin categories', () => {
  it('requires a session', async () => {
    const response = await request(app).get('/api/v1/admin/categories');
    expect(response.status).toBe(401);
  });

  it('creates with Arabic-safe slugs, suffixes duplicates and audits the write', async () => {
    const jar = await signInAs('EDITOR');

    const first = await createCategory(jar);
    const second = await createCategory(jar);

    expect(first.status).toBe(201);
    expect(dataOf(first, adminCategoryDtoSchema)).toMatchObject({
      slugAr: 'التجارة-الإلكترونية',
      slugEn: 'e-commerce',
    });
    expect(dataOf(second, adminCategoryDtoSchema)).toMatchObject({
      slugAr: 'التجارة-الإلكترونية-2',
      slugEn: 'e-commerce-2',
    });
    const audits = await ownerDb.auditLog.findMany({ where: { entity: 'CATEGORY' } });
    expect(audits.map((audit) => audit.action)).toEqual(['CREATE', 'CREATE']);
  });

  it('rejects a taken explicit slug and invalid input with field errors', async () => {
    const jar = await signInAs();
    await createCategory(jar, { slugEn: 'branding' });

    const taken = await createCategory(jar, { slugEn: 'branding' });
    const invalid = await createCategory(jar, { type: 'NOPE', name: { ar: '' } });

    expect([taken.status, errorOf(taken.body).details]).toEqual([
      409,
      [{ path: 'slugEn', message: 'validation.slug.taken' }],
    ]);
    expect(invalid.status).toBe(400);
    expect(errorOf(invalid.body).code).toBe(ERROR_CODES.VALIDATION_FAILED);
  });

  it('updates only the sent fields, records a diff and deletes', async () => {
    const jar = await signInAs();
    const { id } = dataOf(await createCategory(jar), adminCategoryDtoSchema);

    const updated = await adminCall('patch', `/admin/categories/${id}`, jar).send({
      name: { ar: 'متاجر', en: 'Stores' },
    });
    expect(dataOf(updated, adminCategoryDtoSchema)).toMatchObject({
      name: { ar: 'متاجر', en: 'Stores' },
      slugEn: 'e-commerce',
    });
    const audit = await ownerDb.auditLog.findFirst({ where: { action: 'UPDATE' } });
    expect(audit?.changes).toEqual({ name: { from: NAME, to: { ar: 'متاجر', en: 'Stores' } } });

    expect((await adminCall('delete', `/admin/categories/${id}`, jar)).status).toBe(204);
    expect((await adminCall('get', `/admin/categories/${id}`, jar)).status).toBe(404);
  });

  it('refuses to change the type while posts or projects are filed under it', async () => {
    const jar = await signInAs();
    const category = await createCategoryRow('POST', 'news');
    const empty = await createCategoryRow('POST', 'empty');
    const post = await adminCall('post', '/admin/posts', jar).send(
      postBody({ categoryIds: [category.id] }),
    );
    expect(post.status).toBe(201);

    const inUse = await adminCall('patch', `/admin/categories/${category.id}`, jar).send({
      type: 'PROJECT',
    });
    const unused = await adminCall('patch', `/admin/categories/${empty.id}`, jar).send({
      type: 'PROJECT',
    });

    expect([inUse.status, errorOf(inUse.body).details]).toEqual([
      409,
      [{ path: 'type', message: 'validation.category.inUse' }],
    ]);
    expect(await ownerDb.category.findUnique({ where: { id: category.id } })).toMatchObject({
      type: 'POST',
    });
    expect(dataOf(unused, adminCategoryDtoSchema).type).toBe('PROJECT');
  });

  it('paginates, filters and searches', async () => {
    const jar = await signInAs();
    await createCategory(jar);
    await createCategory(jar, { type: 'POST', name: { ar: 'تسويق', en: 'Marketing' } });

    const filtered = await adminCall('get', '/admin/categories?type=POST', jar);
    const searched = await adminCall('get', '/admin/categories?q=تسو', jar);

    expect(dataOf(filtered, z.array(adminCategoryDtoSchema)).map((item) => item.slugEn)).toEqual([
      'marketing',
    ]);
    expect(dataOf(searched, z.array(adminCategoryDtoSchema))).toHaveLength(1);
    expect((filtered.body as { meta: object }).meta).toEqual({
      page: 1,
      pageSize: 12,
      total: 1,
      totalPages: 1,
    });
  });
});

describe('GET /public/categories', () => {
  it('serves from the cache until a write invalidates it', async () => {
    const jar = await signInAs();
    await createCategory(jar);
    const list = () => request(app).get('/api/v1/public/categories?type=PROJECT');

    expect(dataOf(await list(), z.array(categoryDtoSchema))).toHaveLength(1);
    // Written behind the API's back: the cached answer stays until an API write.
    await ownerDb.category.create({
      data: { name: NAME, slugAr: 'مباشر', slugEn: 'direct', type: 'PROJECT' },
    });
    expect(dataOf(await list(), z.array(categoryDtoSchema))).toHaveLength(1);

    await createCategory(jar);
    const fresh = await list();
    expect(dataOf(fresh, z.array(categoryDtoSchema))).toHaveLength(3);
    expect(Object.keys(dataOf(fresh, z.array(categoryDtoSchema))[0] ?? {}).sort()).toEqual(
      ['id', 'name', 'slugAr', 'slugEn', 'type'].sort(),
    );
  });

  it('answers 304 to a matching If-None-Match', async () => {
    const first = await request(app).get('/api/v1/public/categories');
    const etag = first.headers.etag;
    const second = await request(app)
      .get('/api/v1/public/categories')
      .set('If-None-Match', etag ?? '');

    expect(etag).toBeDefined();
    expect(second.status).toBe(304);
  });
});
