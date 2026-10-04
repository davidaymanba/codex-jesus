/**
 * Cached public read benchmark (docs/phases/03 acceptance: p95 < 100 ms locally).
 * Run against a started API: `pnpm --filter @codex/api bench` (reads apps/api/.env).
 *
 * Requests carry the web server's internal token, like real SSR traffic, and stay below that
 * bucket's per-minute budget, so rate limiting never skews the numbers. autocannon reports
 * p90 and p97.5 (no p95): p97.5 under the budget proves p95 is too.
 */
import autocannon from 'autocannon';

import { INTERNAL_API_HEADER } from '@codex/shared';

const BASE_URL = process.env.BENCH_API_URL ?? `http://localhost:${process.env.PORT ?? '4000'}`;
const ENDPOINTS = [
  '/api/v1/public/services',
  '/api/v1/public/projects',
  '/api/v1/public/posts',
  '/api/v1/public/settings',
];
const REQUESTS_PER_ENDPOINT = 600;
const CONNECTIONS = 10;
const BUDGET_MS = 100;

const headers = process.env.INTERNAL_API_TOKEN
  ? { [INTERNAL_API_HEADER]: process.env.INTERNAL_API_TOKEN }
  : undefined;

async function measure(path: string) {
  const url = `${BASE_URL}${path}`;
  // Warm the cache: the benchmark measures cached reads.
  await fetch(url, headers ? { headers } : {});
  const result = await autocannon({
    url,
    connections: CONNECTIONS,
    amount: REQUESTS_PER_ENDPOINT,
    ...(headers && { headers }),
  });
  return {
    path,
    p50: result.latency.p50,
    p90: result.latency.p90,
    'p97.5': result.latency.p97_5,
    p99: result.latency.p99,
    'req/s': Math.round(result.requests.average),
    non2xx: result.non2xx,
  };
}

const rows = [];
for (const path of ENDPOINTS) rows.push(await measure(path));

process.stdout.write(
  `Latency in ms, ${REQUESTS_PER_ENDPOINT} requests × ${CONNECTIONS} connections\n`,
);
process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
const failures = rows.filter((row) => row['p97.5'] >= BUDGET_MS || row.non2xx > 0);
if (failures.length > 0) {
  process.stderr.write(`Over budget or failing: ${failures.map((row) => row.path).join(', ')}\n`);
  process.exitCode = 1;
}
