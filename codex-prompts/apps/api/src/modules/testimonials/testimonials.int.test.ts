import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { adminTestimonialDtoSchema, testimonialDtoSchema } from '@codex/shared';

import { ownerDb } from '@/test/integration/database.js';
import { createMedia, localized } from '@/test/integration/fixtures.js';
import { adminCall, app, dataOf, signInAs } from '@/test/integration/http.js';

const body = (overrides: Record<string, unknown> = {}) => ({
  clientName: 'Sara Ahmed',
  role: localized('مديرة التسويق', 'Marketing Director'),
  quote: localized('فريق رائع', 'A great team'),
  rating: 5,
  ...overrides,
});

describe('testimonials', () => {
  it('lists only visible testimonials publicly, in the arranged order', async () => {
    const jar = await signInAs();
    const photo = await createMedia();
    const create = async (overrides: Record<string, unknown>) =>
      dataOf(
        await adminCall('post', '/admin/testimonials', jar).send(body(overrides)),
        adminTestimonialDtoSchema,
      );
    const first = await create({ photoId: photo.id });
    const second = await create({ clientName: 'Omar Ali' });
    await create({ clientName: 'Hidden Person', isVisible: false });

    await adminCall('put', '/admin/testimonials/reorder', jar).send({ ids: [second.id, first.id] });
    const items = dataOf(
      await request(app).get('/api/v1/public/testimonials'),
      z.array(testimonialDtoSchema),
    );

    expect(items.map((item) => item.clientName)).toEqual(['Omar Ali', 'Sara Ahmed']);
    expect(items[1]?.photo?.id).toBe(photo.id);
  });

  it('rejects an out-of-range rating and audits updates', async () => {
    const jar = await signInAs('EDITOR');
    const invalid = await adminCall('post', '/admin/testimonials', jar).send(body({ rating: 6 }));
    const created = dataOf(
      await adminCall('post', '/admin/testimonials', jar).send(body()),
      adminTestimonialDtoSchema,
    );
    await adminCall('patch', `/admin/testimonials/${created.id}`, jar).send({ rating: 4 });

    expect(invalid.status).toBe(400);
    const audit = await ownerDb.auditLog.findFirst({
      where: { action: 'UPDATE', entity: 'TESTIMONIAL' },
    });
    expect(audit?.changes).toEqual({ rating: { from: 5, to: 4 } });
  });
});
