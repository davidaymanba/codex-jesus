import { revalidateTag } from 'next/cache';

import { serverEnv } from '@/env/server';
import { handleRevalidation } from '@/lib/revalidation/handle-revalidation';

/**
 * Signed webhook from the API after content writes (docs/phases/04 §9). Expiring the tags
 * immediately (`expire: 0`) makes an edit visible on the next request; the refetch is cheap
 * because the API serves it from Redis.
 */
export function POST(request: Request): Promise<Response> {
  return handleRevalidation(request, {
    secret: serverEnv.REVALIDATE_SECRET,
    revalidate: (tag) => {
      revalidateTag(tag, { expire: 0 });
    },
  });
}
