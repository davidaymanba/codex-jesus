import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { adminPostDtoSchema, postDtoSchema, postSummaryDtoSchema } from '@codex/shared';

import { createCategoryRow, localized, postBody, richText } from '@/test/integration/fixtures.js';
import { adminCall, app, dataOf, signInAs } from '@/test/integration/http.js';

type Jar = Awaited<ReturnType<typeof signInAs>>;

async function createPost(jar: Jar, overrides: Record<string, unknown> = {}) {
  const response = await adminCall('post', '/admin/posts', jar).send(postBody(overrides));
  expect(response.status).toBe(201);
  return dataOf(response, adminPostDtoSchema);
}

const listPublic = async (query = '') =>
  dataOf(await request(app).get(`/api/v1/public/posts${query}`), z.array(postSummaryDtoSchema));

describe('public posts', () => {
  it('searches Arabic without diacritics or hamza, and English case-insensitively', async () => {
    const jar = await signInAs();
    await createPost(jar, {
      title: localized('المتاجر الإلكترونيَّة في السعودية', 'E-Commerce Stores'),
    });
    await createPost(jar, { title: localized('التسويق بالمحتوى', 'Content Marketing') });

    const arabic = await listPublic(`?q=${encodeURIComponent('الالكترونية')}`);
    const english = await listPublic('?q=commerce');

    expect(arabic.map((post) => post.slugEn)).toEqual(['e-commerce-stores']);
    expect(english.map((post) => post.slugEn)).toEqual(['e-commerce-stores']);
    // LIKE wildcards are data, not patterns.
    expect(await listPublic('?q=%25%25')).toHaveLength(0);
  });

  it('exposes the author name only and computes reading time per locale', async () => {
    const jar = await signInAs();
    const words = (count: number) => Array.from({ length: count }, () => 'كلمة').join(' ');
    const post = await createPost(jar, {
      content: { ar: richText(words(400)), en: richText('short') },
    });

    const response = await request(app).get(`/api/v1/public/posts/${post.slugEn}?locale=en`);
    const detail = dataOf(response, postDtoSchema);

    expect(detail.readingTime).toEqual({ ar: 3, en: 1 });
    expect(detail.author).toEqual({ name: 'Test User' });
    expect(response.text).not.toMatch(/@codex\.example|authorId|searchText/);
  });

  it('lists related posts by shared category, topped up with the latest', async () => {
    const jar = await signInAs();
    const category = await createCategoryRow('POST', 'branding');
    const main = await createPost(jar, { categoryIds: [category.id] });
    const sibling = await createPost(jar, {
      title: localized('شعار', 'Logo Design'),
      categoryIds: [category.id],
    });
    const other = await createPost(jar, { title: localized('أخبار', 'News') });

    const response = await request(app).get(
      `/api/v1/public/posts/${main.slugEn}/related?locale=en`,
    );
    const related = dataOf(response, z.array(postSummaryDtoSchema));

    expect(related.map((post) => post.id)).toEqual([sibling.id, other.id]);
  });
});

describe('admin posts', () => {
  it('records the signed-in user as author and rejects project categories', async () => {
    const jar = await signInAs('EDITOR');
    const projectCategory = await createCategoryRow('PROJECT', 'erp');

    const post = await createPost(jar);
    const wrong = await adminCall('post', '/admin/posts', jar).send(
      postBody({ categoryIds: [projectCategory.id] }),
    );

    expect(post.authorId).toMatch(/^[0-9a-f-]{36}$/);
    expect(wrong.status).toBe(400);
  });

  it('recomputes reading time when the content changes', async () => {
    const jar = await signInAs();
    const post = await createPost(jar);
    const long = Array.from({ length: 600 }, () => 'word').join(' ');

    const updated = await adminCall('patch', `/admin/posts/${post.id}`, jar).send({
      content: { ar: richText('قصير'), en: richText(long) },
    });

    expect(dataOf(updated, adminPostDtoSchema).readingTime).toEqual({ ar: 1, en: 3 });
  });
});
