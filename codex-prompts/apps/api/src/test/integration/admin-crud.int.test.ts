import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ownerDb } from '@/test/integration/database.js';
import {
  createMedia,
  localized,
  postBody,
  projectBody,
  serviceBody,
} from '@/test/integration/fixtures.js';
import { adminCall, dataOf, signInAs } from '@/test/integration/http.js';

const withId = z.object({ id: z.uuid() }).loose();

interface Collection {
  path: string;
  create: () => Record<string, unknown> | Promise<Record<string, unknown>>;
  update: Record<string, unknown>;
  reorder?: boolean;
  /** List query exercising the module's filters. */
  filter: string;
}

const COLLECTIONS: Collection[] = [
  {
    path: '/admin/services',
    create: () => serviceBody(),
    update: { order: 3, status: 'DRAFT' },
    reorder: true,
    filter: '?status=DRAFT&category=DEVELOPMENT&sortBy=updatedAt&sortOrder=desc',
  },
  {
    path: '/admin/projects',
    create: () => projectBody(),
    update: { client: 'ACME' },
    reorder: true,
    filter: '?status=PUBLISHED&isFeatured=false&serviceCategory=DEVELOPMENT&q=fashion',
  },
  {
    path: '/admin/posts',
    create: () => postBody(),
    update: { isFeatured: true, publishedAt: new Date().toISOString() },
    filter: '?status=PUBLISHED&isFeatured=true&q=identity&sortBy=createdAt',
  },
  {
    path: '/admin/tags',
    create: () => ({ name: localized('شوبيفاي', 'Shopify') }),
    update: { slugAr: 'شوبيفاي-متاجر' },
    filter: '?q=shop',
  },
  {
    path: '/admin/testimonials',
    create: async () => ({
      clientName: 'Huda',
      role: localized('مديرة', 'Director'),
      quote: localized('ممتاز', 'Excellent'),
      rating: 5,
      photoId: (await createMedia()).id,
    }),
    update: { isVisible: false, photoId: null },
    reorder: true,
    filter: '?isVisible=false&sortBy=createdAt',
  },
  {
    path: '/admin/team',
    create: () => ({
      name: localized('علي', 'Ali'),
      role: localized('مطور', 'Developer'),
      bio: localized('نبذة', 'Bio'),
      team: 'DEVELOPMENT',
    }),
    update: { team: 'BRAND', socials: [{ platform: 'GITHUB', url: 'https://github.com/example' }] },
    reorder: true,
    filter: '?team=BRAND&isVisible=true',
  },
  {
    path: '/admin/clients',
    create: async () => ({ name: 'Client Co', logoId: (await createMedia()).id }),
    update: { website: 'https://client.example' },
    reorder: true,
    filter: '?isVisible=true',
  },
];

describe.each(COLLECTIONS)('admin $path', ({ path, create, update, reorder, filter }) => {
  it('creates, lists with filters, reads, updates, reorders and deletes (audited)', async () => {
    const jar = await signInAs('EDITOR');
    const first = dataOf(await adminCall('post', path, jar).send(await create()), withId);
    const second = dataOf(await adminCall('post', path, jar).send(await create()), withId);

    const updated = await adminCall('patch', `${path}/${first.id}`, jar).send(update);
    expect(updated.status).toBe(200);
    const listed = dataOf(await adminCall('get', `${path}${filter}`, jar), z.array(withId));
    expect(listed.map(({ id }) => id)).toContain(first.id);
    expect(dataOf(await adminCall('get', `${path}/${first.id}`, jar), withId).id).toBe(first.id);

    if (reorder) {
      const reordered = await adminCall('put', `${path}/reorder`, jar).send({
        ids: [second.id, first.id],
      });
      expect(reordered.status).toBe(200);
    }
    expect((await adminCall('delete', `${path}/${second.id}`, jar)).status).toBe(204);
    expect((await adminCall('get', `${path}/${second.id}`, jar)).status).toBe(404);
    expect((await adminCall('patch', `${path}/${second.id}`, jar).send(update)).status).toBe(404);
    expect((await adminCall('delete', `${path}/${second.id}`, jar)).status).toBe(404);
    expect(await ownerDb.auditLog.count({ where: { action: 'DELETE' } })).toBe(1);
  });
});

describe('admin media and settings reads', () => {
  it('lists media, edits alt text and reads settings', async () => {
    const admin = await signInAs('ADMIN');
    const media = await createMedia();

    const list = dataOf(
      await adminCall('get', '/admin/media?mimeType=image/jpeg', admin),
      z.array(withId),
    );
    const patched = await adminCall('patch', `/admin/media/${media.id}`, admin).send({
      alt: localized('شعار', 'Logo'),
    });
    const single = await adminCall('get', `/admin/media/${media.id}`, admin);
    const missingSettings = await adminCall('get', '/admin/settings', admin);
    const noStorage = await adminCall(
      'get',
      '/admin/media/01a0f22c-2844-7730-8ecd-ee01e0578000',
      admin,
    );

    expect(list.map(({ id }) => id)).toEqual([media.id]);
    expect(patched.status).toBe(200);
    expect(single.status).toBe(200);
    expect(missingSettings.status).toBe(404);
    expect(noStorage.status).toBe(404);
  });
});
