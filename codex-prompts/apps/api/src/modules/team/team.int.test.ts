import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { adminTeamMemberDtoSchema, teamMemberDtoSchema } from '@codex/shared';

import { localized } from '@/test/integration/fixtures.js';
import { adminCall, app, dataOf, signInAs } from '@/test/integration/http.js';

describe('team', () => {
  it('filters the public team by team and hides invisible members', async () => {
    const jar = await signInAs();
    const member = (team: string, isVisible = true) => ({
      name: localized('عضو', `Member ${team}`),
      role: localized('مصمم', 'Designer'),
      bio: localized('نبذة', 'Bio'),
      team,
      isVisible,
      socials: [{ platform: 'LINKEDIN', url: 'https://www.linkedin.com/in/example' }],
    });
    for (const input of [member('BRAND'), member('DEVELOPMENT'), member('BRAND', false)]) {
      const response = await adminCall('post', '/admin/team', jar).send(input);
      dataOf(response, adminTeamMemberDtoSchema);
    }

    const brand = dataOf(
      await request(app).get('/api/v1/public/team?team=BRAND'),
      z.array(teamMemberDtoSchema),
    );

    expect(brand).toHaveLength(1);
    expect(brand[0]?.socials).toEqual([
      { platform: 'LINKEDIN', url: 'https://www.linkedin.com/in/example' },
    ]);
  });
});
