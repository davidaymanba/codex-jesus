import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import type { ReactNode } from 'react';

import { CLIENT_NAMESPACES } from '@/lib/i18n/client-namespaces';

type Namespace = keyof Awaited<ReturnType<typeof getMessages>>;

/**
 * Hands extra message namespaces to the client components inside (form labels, validation
 * and API error texts), on the pages that need them only. A nested provider replaces the
 * layout's messages, so the layout's namespaces are passed along too.
 */
export async function ClientMessages({
  namespaces,
  children,
}: {
  namespaces: readonly Namespace[];
  children: ReactNode;
}) {
  const messages = await getMessages();
  const picked = Object.fromEntries(
    [...CLIENT_NAMESPACES, ...namespaces].map((namespace) => [namespace, messages[namespace]]),
  );
  return <NextIntlClientProvider messages={picked}>{children}</NextIntlClientProvider>;
}
