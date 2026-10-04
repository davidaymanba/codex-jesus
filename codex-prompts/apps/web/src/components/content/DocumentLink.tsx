import { getLocale } from 'next-intl/server';
import type { ComponentProps } from 'react';

import { localizedPath } from '@/lib/seo/metadata';

interface DocumentLinkProps extends Omit<ComponentProps<'a'>, 'href'> {
  /** Path with query, without the locale prefix. */
  href: string;
}

/**
 * A plain link (full page load) in the current locale, for links that only change the search
 * params (filters, pagination, search): on such a soft navigation Next.js 16 keeps the
 * previous page's <head> (title, canonical) while the body updates. A full load always gets
 * the right metadata and works the same without JavaScript.
 */
export async function DocumentLink({ href, children, ...props }: DocumentLinkProps) {
  const locale = await getLocale();
  return (
    <a href={localizedPath(locale, href)} {...props}>
      {children}
    </a>
  );
}
