import { describe, expect, it, vi } from 'vitest';

import { startPublicationScheduler } from './publication-scheduler.js';

describe('publication scheduler', () => {
  it('announces content that went live since the last check, then moves the window', async () => {
    let clock = new Date('2026-10-01T09:00:00Z');
    const findWentLive = vi
      .fn()
      .mockResolvedValueOnce({ posts: ['p1'], projects: [] })
      .mockResolvedValueOnce({ posts: [], projects: [] });
    const publish = vi.fn(() => Promise.resolve());
    const scheduler = startPublicationScheduler({ findWentLive, publish, now: () => clock });

    clock = new Date('2026-10-01T09:01:00Z');
    await scheduler.tick();
    clock = new Date('2026-10-01T09:02:00Z');
    await scheduler.tick();
    scheduler.stop();

    expect(findWentLive.mock.calls).toEqual([
      [new Date('2026-10-01T09:00:00Z'), new Date('2026-10-01T09:01:00Z')],
      [new Date('2026-10-01T09:01:00Z'), new Date('2026-10-01T09:02:00Z')],
    ]);
    expect(publish.mock.calls).toEqual([[['posts', 'posts:p1', 'sitemap']]]);
  });

  it('keeps the window open after a failed check', async () => {
    let clock = new Date('2026-10-01T09:00:00Z');
    const findWentLive = vi
      .fn()
      .mockRejectedValueOnce(new Error('db down'))
      .mockResolvedValueOnce({ posts: [], projects: ['x'] });
    const publish = vi.fn(() => Promise.resolve());
    const scheduler = startPublicationScheduler({ findWentLive, publish, now: () => clock });

    clock = new Date('2026-10-01T09:01:00Z');
    await scheduler.tick();
    clock = new Date('2026-10-01T09:02:00Z');
    await scheduler.tick();
    scheduler.stop();

    expect(findWentLive.mock.calls[1]?.[0]).toEqual(new Date('2026-10-01T09:00:00Z'));
    expect(publish).toHaveBeenCalledWith(['projects', 'projects:x', 'sitemap']);
  });
});
