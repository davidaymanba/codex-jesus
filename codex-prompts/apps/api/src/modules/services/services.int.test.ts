import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  adminServiceDtoSchema,
  reorderResultDtoSchema,
  serviceDtoSchema,
  serviceSummaryDtoSchema,
  sitemapDataDtoSchema,
} from '@codex/shared';

import { ownerDb } from '@/test/integration/database.js';
import { createMedia, localized, serviceBody } from '@/test/integration/fixtures.js';
import { adminCall, app, dataOf, signInAs } from '@/test/integration/http.js';

type Jar = Awaited<ReturnType<typeof signInAs>>;

async function createService(jar: Jar, overrides: Record<string, unknown> = {}) {
  const response = await adminCall('post', '/admin/services', jar).send(serviceBody(overrides));
  expect(response.status).toBe(201);
  return dataOf(response, adminServiceDtoSchema);
}

describe('public services', () => {
  it('lists published services only, in order, with embedded cover media', async () => {
    const jar = await signInAs();
    const cover = await createMedia();
    await createService(jar, { order: 2, title: localized('تسويق', 'Marketing') });
    await createService(jar, { order: 1, coverId: cover.id });
    await createService(jar, { status: 'DRAFT', title: localized('مسودة', 'Draft') });

    const response = await request(app).get('/api/v1/public/services');
    const items = dataOf(response, z.array(serviceSummaryDtoSchema));

    expect(items.map((item) => item.slugEn)).toEqual(['software-development', 'marketing']);
    expect(items[0]?.cover).toEqual({
      id: cover.id,
      url: cover.url,
      alt: localized('صورة', 'Image'),
      width: 1200,
      height: 800,
    });
    expect(response.text).not.toMatch(/"status"|coverId|publicId/);
  });

  it('finds a published service by its slug in the requested locale', async () => {
    const jar = await signInAs();
    const service = await createService(jar);

    const arabic = await request(app).get(
      `/api/v1/public/services/${encodeURIComponent(service.slugAr)}?locale=ar`,
    );
    const english = await request(app).get(`/api/v1/public/services/${service.slugEn}?locale=en`);
    const wrongLocale = await request(app).get(`/api/v1/public/services/${service.slugEn}`);

    expect(dataOf(arabic, serviceDtoSchema).id).toBe(service.id);
    expect(dataOf(english, serviceDtoSchema).slugAr).toBe(service.slugAr);
    expect(wrongLocale.status).toBe(404);
  });

  it('hides a service once it is unpublished (cache invalidated on write)', async () => {
    const jar = await signInAs();
    const service = await createService(jar);
    const read = () => request(app).get(`/api/v1/public/services/${service.slugEn}?locale=en`);
    expect((await read()).status).toBe(200);

    await adminCall('patch', `/admin/services/${service.id}`, jar).send({ status: 'DRAFT' });

    expect((await read()).status).toBe(404);
    const audit = await ownerDb.auditLog.findFirst({ where: { action: 'STATUS_CHANGE' } });
    expect(audit?.changes).toEqual({ status: { from: 'PUBLISHED', to: 'DRAFT' } });
  });
});

describe('admin services', () => {
  it('reorders atomically and rejects unknown ids', async () => {
    const jar = await signInAs();
    const first = await createService(jar);
    const second = await createService(jar, { title: localized('هوية', 'Branding') });

    const reordered = await adminCall('put', '/admin/services/reorder', jar).send({
      ids: [second.id, first.id],
    });
    const unknown = await adminCall('put', '/admin/services/reorder', jar).send({
      ids: [first.id, '01a0f22c-2844-7730-8ecd-ee01e0578000'],
    });

    expect(dataOf(reordered, reorderResultDtoSchema)).toEqual({ updated: 2 });
    expect(unknown.status).toBe(400);
    const orders = await ownerDb.service.findMany({
      orderBy: { order: 'asc' },
      select: { id: true },
    });
    expect(orders.map(({ id }) => id)).toEqual([second.id, first.id]);
  });

  it('refreshes the cached sitemap after a reorder (it moves updatedAt)', async () => {
    const jar = await signInAs();
    const first = await createService(jar);
    const second = await createService(jar, { title: localized('هوية', 'Branding') });
    const sitemapTimes = async () =>
      dataOf(await request(app).get('/api/v1/public/sitemap-data'), sitemapDataDtoSchema)
        .services.map(({ updatedAt }) => updatedAt)
        .sort();

    const before = await sitemapTimes();
    await adminCall('put', '/admin/services/reorder', jar).send({ ids: [second.id, first.id] });
    const stored = await ownerDb.service.findMany({ select: { updatedAt: true } });

    expect(await sitemapTimes()).not.toEqual(before);
    expect(await sitemapTimes()).toEqual(
      stored.map(({ updatedAt }) => updatedAt.toISOString()).sort(),
    );
  });

  it('refuses media that does not exist (409) and unsafe rich text (400)', async () => {
    const jar = await signInAs();
    const missingCover = await adminCall('post', '/admin/services', jar).send(
      serviceBody({ coverId: '01a0f22c-2844-7730-8ecd-ee01e0578000' }),
    );
    const unsafe = await adminCall('post', '/admin/services', jar).send(
      serviceBody({
        content: {
          ar: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'x',
                    marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
                  },
                ],
              },
            ],
          },
          en: { type: 'doc', content: [{ type: 'paragraph' }] },
        },
      }),
    );

    expect(missingCover.status).toBe(409);
    expect(unsafe.status).toBe(400);
  });
});
