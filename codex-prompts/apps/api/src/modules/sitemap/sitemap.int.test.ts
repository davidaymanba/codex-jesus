import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { sitemapDataDtoSchema } from '@codex/shared';

import { localized, postBody, serviceBody } from '@/test/integration/fixtures.js';
import { adminCall, app, dataOf, signInAs } from '@/test/integration/http.js';

describe('GET /public/sitemap-data', () => {
  it('lists published content only and refreshes after a write', async () => {
    const jar = await signInAs();
    await adminCall('post', '/admin/services', jar).send(serviceBody());
    await adminCall('post', '/admin/posts', jar).send(postBody({ status: 'DRAFT' }));
    const read = async () =>
      dataOf(await request(app).get('/api/v1/public/sitemap-data'), sitemapDataDtoSchema);

    expect((await read()).services.map((entry) => entry.slugEn)).toEqual(['software-development']);
    expect((await read()).posts).toEqual([]);

    await adminCall('post', '/admin/posts', jar).send(
      postBody({ title: localized('منشور', 'Published Post') }),
    );
    expect((await read()).posts.map((entry) => entry.slugEn)).toEqual(['published-post']);
  });
});
