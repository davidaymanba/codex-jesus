import 'server-only';

import { serverEnv } from '@/env/server';

import { createApiClient } from './create-client';

/** The server-side API client (never bundled for the browser). */
export const apiFetch = createApiClient({
  baseUrl: serverEnv.API_URL,
  internalToken: serverEnv.INTERNAL_API_TOKEN,
  shouldValidate: serverEnv.NODE_ENV !== 'production',
});
