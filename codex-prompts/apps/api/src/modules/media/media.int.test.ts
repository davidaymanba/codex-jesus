import sharp from 'sharp';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import {
  adminMediaDtoSchema,
  ERROR_CODES,
  mediaUsageDtoSchema,
  type ApiError,
} from '@codex/shared';

import { ownerDb } from '@/test/integration/database.js';
import { createMedia, postBody, richText } from '@/test/integration/fixtures.js';
import { adminCall, dataOf, signInAs } from '@/test/integration/http.js';

const storage = vi.hoisted(() => ({
  uploads: [] as Buffer[],
  destroyed: [] as string[],
}));

// Cloudinary is never called from tests.
vi.mock('@/lib/media-storage.js', () => ({
  mediaStorage: {
    upload: (image: Buffer) => {
      storage.uploads.push(image);
      const publicId = `codex/test/${storage.uploads.length}`;
      return Promise.resolve({
        publicId,
        url: `https://res.cloudinary.com/codex/image/upload/${publicId}.jpg`,
      });
    },
    destroy: (publicId: string) => {
      storage.destroyed.push(publicId);
      return Promise.resolve();
    },
  },
}));

const errorOf = (body: unknown) => (body as ApiError).error;

function jpegWithExif(width = 64, height = 48) {
  return sharp({ create: { width, height, channels: 3, background: '#0049B2' } })
    .jpeg()
    .withExif({ IFD0: { Copyright: 'Secret camera owner', Make: 'Phone' } })
    .toBuffer();
}

async function upload(
  jar: Awaited<ReturnType<typeof signInAs>>,
  file: Buffer,
  name = 'photo.jpg',
  type = 'image/jpeg',
) {
  return adminCall('post', '/admin/media', jar)
    .field('altAr', 'صورة')
    .field('altEn', 'Photo')
    .attach('file', file, { filename: name, contentType: type });
}

beforeEach(() => {
  storage.uploads = [];
  storage.destroyed = [];
});

describe('media upload', () => {
  it('stores a re-encoded image without EXIF, with its real size', async () => {
    const jar = await signInAs('EDITOR');
    const original = await jpegWithExif();
    expect((await sharp(original).metadata()).exif).toBeDefined();

    const response = await upload(jar, original);
    const media = dataOf(response, adminMediaDtoSchema);

    expect(media).toMatchObject({
      width: 64,
      height: 48,
      mimeType: 'image/jpeg',
      alt: { ar: 'صورة', en: 'Photo' },
    });
    const [stored] = storage.uploads;
    expect(stored).toBeDefined();
    const metadata = await sharp(stored).metadata();
    expect(metadata.exif).toBeUndefined();
  });

  it('removes the stored file again when the record cannot be saved', async () => {
    const jar = await signInAs();
    // The fake storage hands out `codex/test/1` next; a row already holding it makes the insert fail.
    await createMedia('codex/test/1');

    const response = await upload(jar, await jpegWithExif());

    expect(response.status).toBe(409);
    expect(storage.destroyed).toEqual(['codex/test/1']);
  });

  it('rejects a fake image by its bytes, not its name or declared type', async () => {
    const jar = await signInAs();
    const html = Buffer.from('<html><script>alert(1)</script></html>');
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    );

    const fake = await upload(jar, html, 'cat.png', 'image/png');
    const vector = await upload(jar, svg, 'logo.svg', 'image/svg+xml');

    expect([fake.status, errorOf(fake.body).details]).toEqual([
      400,
      [{ path: 'file', message: 'validation.file.unsupportedType' }],
    ]);
    expect(vector.status).toBe(400);
    expect(storage.uploads).toHaveLength(0);
  });

  it('rejects files over 5 MB and uploads without a file', async () => {
    const jar = await signInAs();
    const huge = Buffer.alloc(5 * 1024 * 1024 + 1, 0xff);

    const tooBig = await upload(jar, huge);
    const missing = await adminCall('post', '/admin/media', jar)
      .field('altAr', 'x')
      .field('altEn', 'x');

    expect([tooBig.status, errorOf(tooBig.body).code]).toEqual([
      413,
      ERROR_CODES.PAYLOAD_TOO_LARGE,
    ]);
    expect(missing.status).toBe(400);
  });
});

describe('media delete', () => {
  it('refuses while used (relations and rich text), and never sends placeholders to Cloudinary', async () => {
    const jar = await signInAs();
    const cover = await createMedia();
    const inline = await createMedia();
    await adminCall('post', '/admin/posts', jar).send(
      postBody({
        coverId: cover.id,
        content: {
          ar: { type: 'doc', content: [{ type: 'image', attrs: { src: inline.url } }] },
          en: richText('text'),
        },
      }),
    );

    const usage = dataOf(
      await adminCall('get', `/admin/media/${inline.id}/usage`, jar),
      z.array(mediaUsageDtoSchema),
    );
    const blocked = await adminCall('delete', `/admin/media/${cover.id}`, jar);
    expect(usage).toEqual([{ entity: 'POST', id: expect.any(String) as string, field: 'content' }]);
    expect([blocked.status, errorOf(blocked.body).code]).toEqual([409, ERROR_CODES.MEDIA_IN_USE]);
    expect(errorOf(blocked.body).details?.[0]?.path).toMatch(/^POST\..+\.cover$/);

    const placeholder = await createMedia('placeholder/hero');
    expect((await adminCall('delete', `/admin/media/${placeholder.id}`, jar)).status).toBe(204);
    expect(storage.destroyed).toEqual([]);
    expect(await ownerDb.media.count({ where: { id: placeholder.id } })).toBe(0);
  });

  it('deletes unused uploads from Cloudinary too', async () => {
    const jar = await signInAs();
    const media = dataOf(await upload(jar, await jpegWithExif()), adminMediaDtoSchema);

    expect((await adminCall('delete', `/admin/media/${media.id}`, jar)).status).toBe(204);
    expect(storage.destroyed).toEqual([media.publicId]);
  });
});
