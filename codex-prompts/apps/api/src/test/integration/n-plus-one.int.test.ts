import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { redis } from '@/lib/redis.js';
import { ownerDb } from '@/test/integration/database.js';
import {
  createCategoryRow,
  createMedia,
  createQuoteRow,
  localized,
  postBody,
  projectBody,
  serviceBody,
} from '@/test/integration/fixtures.js';
import { adminCall, app, signInAs } from '@/test/integration/http.js';
import { countQueries } from '@/test/integration/query-count.js';

type Jar = Awaited<ReturnType<typeof signInAs>>;

/** Queries for one uncached list request (Redis flushed first, so the database is hit). */
async function queriesFor(path: string, jar?: Jar): Promise<number> {
  await redis?.flushDb();
  return countQueries(async () => {
    const response = jar
      ? await adminCall('get', path, jar)
      : await request(app).get(`/api/v1${path}`);
    expect(response.status).toBe(200);
  });
}

async function addContent(jar: Jar, round: number) {
  const postCategory = await createCategoryRow('POST', `posts-${round}`);
  const projectCategory = await createCategoryRow('PROJECT', `projects-${round}`);
  const tag = await ownerDb.tag.create({
    data: { name: localized('وسم', 'Tag'), slugAr: `وسم-${round}`, slugEn: `tag-${round}` },
  });
  for (let index = 0; index < 4; index += 1) {
    const cover = await createMedia();
    const title = localized(`عنوان ${round} ${index}`, `Title ${round} ${index}`);
    await adminCall('post', '/admin/posts', jar).send(
      postBody({ title, coverId: cover.id, categoryIds: [postCategory.id], tagIds: [tag.id] }),
    );
    await adminCall('post', '/admin/projects', jar).send(
      projectBody({
        title,
        coverId: cover.id,
        categoryIds: [projectCategory.id],
        galleryIds: [cover.id],
      }),
    );
    await adminCall('post', '/admin/services', jar).send(serviceBody({ title, coverId: cover.id }));
    await createQuoteRow({ name: `Lead ${round} ${index}` });
  }
}

/** One request at a time: concurrent requests would mix their counts. */
async function countAll(jar: Jar): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const path of LISTS) {
    counts[path] = await queriesFor(path, path.startsWith('/admin') ? jar : undefined);
  }
  return counts;
}

const LISTS = [
  '/public/posts',
  '/public/projects',
  '/public/services',
  '/admin/posts',
  '/admin/projects',
  '/admin/quotes',
] as const;

describe('list endpoints (no N+1)', () => {
  it('send the same number of queries for 4 rows as for 12', async () => {
    const jar = await signInAs();
    await addContent(jar, 1);
    const small = await countAll(jar);

    await addContent(jar, 2);
    await addContent(jar, 3);
    const large = await countAll(jar);

    process.stdout.write(`Queries per uncached list request: ${JSON.stringify(large)}\n`);
    expect(large).toEqual(small);
  });
});
