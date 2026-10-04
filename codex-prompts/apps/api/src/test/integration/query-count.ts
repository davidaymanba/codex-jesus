import { onQuery } from '@/lib/prisma.js';

/** Counts the SQL statements `work` sends through the app's Prisma client. */
export async function countQueries(work: () => Promise<unknown>): Promise<number> {
  let count = 0;
  const stop = onQuery(() => {
    count += 1;
  });
  try {
    await work();
    return count;
  } finally {
    stop();
  }
}
