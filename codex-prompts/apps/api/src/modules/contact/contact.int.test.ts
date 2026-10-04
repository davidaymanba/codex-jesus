import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { contactMessageDtoSchema } from '@codex/shared';

import { ownerDb } from '@/test/integration/database.js';
import { adminCall, dataOf, signInAs } from '@/test/integration/http.js';

describe('admin contact messages', () => {
  it('lists, archives and exports messages', async () => {
    const jar = await signInAs('EDITOR');
    const { id } = await ownerDb.contactMessage.create({
      data: { name: 'Omar', email: 'omar@client.example', message: '-1+1 please', locale: 'en' },
      select: { id: true },
    });

    const list = dataOf(
      await adminCall('get', '/admin/messages?status=NEW', jar),
      z.array(contactMessageDtoSchema),
    );
    const archived = await adminCall('patch', `/admin/messages/${id}`, jar).send({
      status: 'ARCHIVED',
    });
    const csv = await adminCall('get', '/admin/messages/export.csv?status=ARCHIVED', jar).buffer(
      true,
    );

    expect(list.map((message) => message.id)).toEqual([id]);
    expect(dataOf(archived, contactMessageDtoSchema).status).toBe('ARCHIVED');
    expect(csv.text).toContain(`"'-1+1 please"`);
  });
});
