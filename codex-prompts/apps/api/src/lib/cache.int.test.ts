import { afterEach, describe, expect, it } from 'vitest';

import { createCache } from '@/lib/cache.js';
import { createRedisClient, type RedisClient } from '@/lib/redis.js';

const OPTIONS = { ttlSeconds: 60, tags: ['posts'] };
const clients: RedisClient[] = [];

async function connectedCache() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL is not set for integration tests');
  const client = createRedisClient(url);
  clients.push(client);
  await client.connect();
  return { client, cache: createCache(client) };
}

function deferred<TValue>() {
  let resolve: (value: TValue) => void = () => undefined;
  const promise = new Promise<TValue>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

afterEach(async () => {
  const open = clients.splice(0).filter((client) => client.isOpen);
  await Promise.all(open.map((client) => client.close()));
});

describe('cache', () => {
  it('serves the second read from Redis and reloads after its tag is invalidated', async () => {
    const { cache } = await connectedCache();
    let loads = 0;
    const load = () => Promise.resolve({ loads: ++loads });

    expect(await cache.wrap('list', OPTIONS, load)).toEqual({ loads: 1 });
    expect(await cache.wrap('list', OPTIONS, load)).toEqual({ loads: 1 });
    await cache.invalidateTags(['posts']);
    expect(await cache.wrap('list', OPTIONS, load)).toEqual({ loads: 2 });
  });

  it('never caches a value loaded before an invalidation that finished first', async () => {
    const { cache } = await connectedCache();
    const slowLoad = deferred<string>();

    const pending = cache.wrap('post', OPTIONS, () => slowLoad.promise);
    // Let the wrap read the tag versions before the write lands.
    await new Promise((resolve) => setTimeout(resolve, 20));
    await cache.invalidateTags(['posts']);
    slowLoad.resolve('before the write');

    expect(await pending).toBe('before the write');
    expect(await cache.get('post')).toBeUndefined();
  });

  it('flushes its namespace when an invalidation was missed while Redis was down', async () => {
    const { client, cache } = await connectedCache();
    await cache.set('stale', 'old value', OPTIONS);
    await client.close();

    await cache.invalidateTags(['posts']);
    await client.connect();
    await expect.poll(() => cache.get('stale')).toBeUndefined();
  });
});
