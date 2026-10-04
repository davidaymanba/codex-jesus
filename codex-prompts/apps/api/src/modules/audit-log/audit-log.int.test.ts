import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { auditLogDtoSchema } from '@codex/shared';

import { adminCall, dataOf, signInAs } from '@/test/integration/http.js';

describe('GET /admin/audit-log', () => {
  it('lists entries with their actor for admins only, filtered by action', async () => {
    const admin = await signInAs('ADMIN');
    const editor = await signInAs('EDITOR');

    const logins = dataOf(
      await adminCall('get', '/admin/audit-log?action=LOGIN', admin),
      z.array(auditLogDtoSchema),
    );

    expect(logins).toHaveLength(2);
    expect(logins[0]?.actor?.name).toBe('Test User');
    expect((await adminCall('get', '/admin/audit-log', editor)).status).toBe(403);
  });
});
