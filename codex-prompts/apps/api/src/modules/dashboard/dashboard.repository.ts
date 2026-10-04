import { BaseRepository } from '@/lib/base-repository.js';

/** The raw JSON the stats query returns; the service validates it. */
export interface DashboardStatsRow {
  counts: unknown;
  latestLeads: unknown;
  leadsPerMonth: unknown;
}

const MONTHS = 12;
const LATEST_LEADS = 5;

export class DashboardRepository extends BaseRepository {
  /**
   * Every dashboard number in one round trip: counts, the latest leads and leads per month
   * for the last 12 months in `timeZone` (months without leads come back as zeros, via
   * generate_series). Each part uses an index (status + createdAt, status + publishedAt).
   */
  async stats(timeZone: string): Promise<DashboardStatsRow> {
    const [row] = await this.db.$queryRaw<DashboardStatsRow[]>`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', now() AT TIME ZONE ${timeZone}) - make_interval(months => ${MONTHS - 1}),
          date_trunc('month', now() AT TIME ZONE ${timeZone}),
          interval '1 month'
        ) AS month
      ),
      since AS (SELECT min(month) AT TIME ZONE ${timeZone} AS at FROM months),
      quote_months AS (
        SELECT date_trunc('month', "createdAt" AT TIME ZONE ${timeZone}) AS month, count(*)::int AS total
        FROM quote_requests, since WHERE "createdAt" >= since.at GROUP BY 1
      ),
      message_months AS (
        SELECT date_trunc('month', "createdAt" AT TIME ZONE ${timeZone}) AS month, count(*)::int AS total
        FROM contact_messages, since WHERE "createdAt" >= since.at GROUP BY 1
      )
      SELECT
        json_build_object(
          'newQuotes', (SELECT count(*)::int FROM quote_requests WHERE status = 'NEW'),
          'newMessages', (SELECT count(*)::int FROM contact_messages WHERE status = 'NEW'),
          'publishedPosts', (SELECT count(*)::int FROM posts WHERE status = 'PUBLISHED' AND "publishedAt" <= now()),
          'publishedProjects', (SELECT count(*)::int FROM projects WHERE status = 'PUBLISHED' AND "publishedAt" <= now())
        ) AS counts,
        (
          SELECT coalesce(json_agg(lead ORDER BY lead."createdAt" DESC, lead.id DESC), '[]'::json)
          FROM (
            SELECT id, name, services, status, "createdAt"
            FROM quote_requests ORDER BY "createdAt" DESC, id DESC LIMIT ${LATEST_LEADS}
          ) AS lead
        ) AS "latestLeads",
        (
          SELECT json_agg(
            json_build_object(
              'month', to_char(months.month, 'YYYY-MM'),
              'quotes', coalesce(quote_months.total, 0),
              'messages', coalesce(message_months.total, 0)
            ) ORDER BY months.month
          )
          FROM months
          LEFT JOIN quote_months USING (month)
          LEFT JOIN message_months USING (month)
        ) AS "leadsPerMonth"`;
    if (!row) throw new Error('The dashboard query returned no row');
    return row;
  }
}
