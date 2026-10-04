import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { adminProjectDtoSchema, projectDtoSchema, projectSummaryDtoSchema } from '@codex/shared';

import { ownerDb } from '@/test/integration/database.js';
import {
  createCategoryRow,
  createMedia,
  localized,
  projectBody,
} from '@/test/integration/fixtures.js';
import { adminCall, app, dataOf, signInAs } from '@/test/integration/http.js';

type Jar = Awaited<ReturnType<typeof signInAs>>;

async function createProject(jar: Jar, overrides: Record<string, unknown> = {}) {
  const response = await adminCall('post', '/admin/projects', jar).send(projectBody(overrides));
  expect(response.status).toBe(201);
  return dataOf(response, adminProjectDtoSchema);
}

const listPublic = async (query = '') =>
  dataOf(
    await request(app).get(`/api/v1/public/projects${query}`),
    z.array(projectSummaryDtoSchema),
  );

describe('public projects', () => {
  it('shows only published projects whose publish time has come', async () => {
    const jar = await signInAs();
    await createProject(jar);
    await createProject(jar, { title: localized('مسودة', 'Draft'), status: 'DRAFT' });
    await createProject(jar, {
      title: localized('لاحقًا', 'Later'),
      publishedAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    expect((await listPublic()).map((item) => item.slugEn)).toEqual(['fashion-store']);
  });

  it('appears on time: the cached list expires at the next scheduled publish', async () => {
    const jar = await signInAs();
    await createProject(jar);
    const soon = await createProject(jar, {
      title: localized('قريبًا', 'Soon'),
      publishedAt: new Date(Date.now() + 1500).toISOString(),
    });

    expect(await listPublic()).toHaveLength(1);
    await new Promise((resolve) => setTimeout(resolve, 2100));
    expect((await listPublic()).map((item) => item.id)).toContain(soon.id);
  });

  it('filters by category slug (either locale) and featured flag', async () => {
    const jar = await signInAs();
    const category = await createCategoryRow('PROJECT', 'ecommerce');
    await createProject(jar, { categoryIds: [category.id], isFeatured: true });
    await createProject(jar, { title: localized('آخر', 'Other') });

    expect(await listPublic('?category=ecommerce')).toHaveLength(1);
    expect(await listPublic(`?category=${encodeURIComponent(category.slugAr)}`)).toHaveLength(1);
    expect(await listPublic('?featured=true')).toHaveLength(1);
    expect(await listPublic('?featured=false')).toHaveLength(1);
  });

  it('returns the case study with its gallery in order and no internal fields', async () => {
    const jar = await signInAs();
    const [first, second] = [await createMedia(), await createMedia()];
    const project = await createProject(jar, { galleryIds: [second.id, first.id] });

    const response = await request(app).get(`/api/v1/public/projects/${project.slugEn}?locale=en`);
    const detail = dataOf(response, projectDtoSchema);

    expect(detail.gallery.map((media) => media.id)).toEqual([second.id, first.id]);
    expect(response.text).not.toMatch(/"status"|galleryIds|categoryIds|"order"/);
  });
});

describe('admin projects', () => {
  it('rejects post categories and replaces relations on update', async () => {
    const jar = await signInAs('EDITOR');
    const postCategory = await createCategoryRow('POST', 'news');
    const projectCategory = await createCategoryRow('PROJECT', 'erp');
    const media = await createMedia();

    const wrong = await adminCall('post', '/admin/projects', jar).send(
      projectBody({ categoryIds: [postCategory.id] }),
    );
    expect(wrong.status).toBe(400);

    const project = await createProject(jar, { galleryIds: [media.id] });
    const updated = await adminCall('patch', `/admin/projects/${project.id}`, jar).send({
      galleryIds: [],
      categoryIds: [projectCategory.id],
    });

    expect(dataOf(updated, adminProjectDtoSchema)).toMatchObject({
      galleryIds: [],
      categoryIds: [projectCategory.id],
    });
  });

  it('publishes now when no date is given, and keeps the date on later edits', async () => {
    const jar = await signInAs();
    const draft = await createProject(jar, { status: 'DRAFT' });
    expect(draft.publishedAt).toBeNull();

    const published = dataOf(
      await adminCall('patch', `/admin/projects/${draft.id}`, jar).send({ status: 'PUBLISHED' }),
      adminProjectDtoSchema,
    );
    const edited = dataOf(
      await adminCall('patch', `/admin/projects/${draft.id}`, jar).send({ client: 'ACME' }),
      adminProjectDtoSchema,
    );

    expect(published.publishedAt).not.toBeNull();
    expect(edited.publishedAt).toBe(published.publishedAt);
    expect(await ownerDb.auditLog.count({ where: { action: 'STATUS_CHANGE' } })).toBe(1);
  });
});
