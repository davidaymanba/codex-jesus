import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { adminClientDtoSchema, clientDtoSchema } from '@codex/shared';

import { adminCall, app, dataOf, signInAs } from '@/test/integration/http.js';

describe('clients', () => {
  it('creates, hides and deletes clients; the public list follows', async () => {
    const jar = await signInAs();
    const created = dataOf(
      await adminCall('post', '/admin/clients', jar).send({
        name: '[Client Name]',
        website: 'https://client.example',
      }),
      adminClientDtoSchema,
    );
    const list = async () =>
      dataOf(await request(app).get('/api/v1/public/clients'), z.array(clientDtoSchema));
    expect(await list()).toHaveLength(1);

    await adminCall('patch', `/admin/clients/${created.id}`, jar).send({ isVisible: false });
    expect(await list()).toHaveLength(0);

    expect((await adminCall('delete', `/admin/clients/${created.id}`, jar)).status).toBe(204);
    expect((await adminCall('get', `/admin/clients/${created.id}`, jar)).status).toBe(404);
  });
});
