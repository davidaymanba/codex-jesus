import { describe, expect, it } from 'vitest';

import { dashboardStatsDtoSchema } from '@codex/shared';

import { ownerDb } from '@/test/integration/database.js';
import { createQuoteRow } from '@/test/integration/fixtures.js';
import { adminCall, dataOf, signInAs } from '@/test/integration/http.js';

const monthOf = (date: Date) => date.toISOString().slice(0, 7);

describe('GET /admin/dashboard/stats', () => {
  it('counts new leads, lists the latest five and fills 12 months', async () => {
    const jar = await signInAs('EDITOR');
    for (let index = 0; index < 6; index += 1) {
      await createQuoteRow({
        name: `Lead ${index}`,
        createdAt: new Date(Date.now() - (6 - index) * 1000),
      });
    }
    await createQuoteRow({
      name: 'Old',
      status: 'WON',
      createdAt: new Date(Date.now() - 400 * 864e5),
    });
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setUTCMonth(threeMonthsAgo.getUTCMonth() - 3, 15);
    await ownerDb.contactMessage.create({
      data: {
        name: 'M',
        email: 'm@client.example',
        message: 'Hello there team',
        locale: 'en',
        createdAt: threeMonthsAgo,
      },
    });

    const stats = dataOf(
      await adminCall('get', '/admin/dashboard/stats', jar),
      dashboardStatsDtoSchema,
    );

    expect(stats.counts).toEqual({
      newQuotes: 6,
      newMessages: 1,
      publishedPosts: 0,
      publishedProjects: 0,
    });
    expect(stats.latestLeads.map((lead) => lead.name)).toEqual([
      'Lead 5',
      'Lead 4',
      'Lead 3',
      'Lead 2',
      'Lead 1',
    ]);
    expect(stats.leadsPerMonth).toHaveLength(12);
    expect(stats.leadsPerMonth.at(-1)).toEqual({
      month: monthOf(new Date()),
      quotes: 6,
      messages: 0,
    });
    expect(
      stats.leadsPerMonth.find((entry) => entry.month === monthOf(threeMonthsAgo))?.messages,
    ).toBe(1);
    expect(stats.leadsPerMonth.reduce((sum, entry) => sum + entry.quotes, 0)).toBe(6);
  });
});
