import { z } from 'zod';

import { dashboardStatsDtoSchema, type DashboardStatsDto } from '@codex/shared';

import { env } from '@/config/env.js';

import { DashboardRepository } from './dashboard.repository.js';

const dashboard = new DashboardRepository();

// Postgres renders JSON timestamps with its session offset; the DTO uses UTC ISO strings.
const latestLeadsSchema = z.array(
  dashboardStatsDtoSchema.shape.latestLeads.element.extend({
    createdAt: z.string().transform((value) => new Date(value).toISOString()),
  }),
);

/** Admin dashboard numbers, grouped by month in REPORTING_TIME_ZONE. Not cached: admins only. */
export async function getDashboardStats(): Promise<DashboardStatsDto> {
  const row = await dashboard.stats(env.REPORTING_TIME_ZONE);
  return {
    counts: dashboardStatsDtoSchema.shape.counts.parse(row.counts),
    latestLeads: latestLeadsSchema.parse(row.latestLeads),
    leadsPerMonth: dashboardStatsDtoSchema.shape.leadsPerMonth.parse(row.leadsPerMonth),
  };
}
