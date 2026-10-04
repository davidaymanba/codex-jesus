import type { ReactNode } from 'react';

import { Link } from '@/lib/i18n/navigation';

interface CmsLinkProps {
  /** A site path (`/quote`) or an absolute URL, as stored by the admin. */
  href: string;
  className?: string;
  children: ReactNode;
}

const isSitePath = (href: string) => href.startsWith('/') && !href.startsWith('//');

/**
 * A link whose target comes from the CMS: site paths stay in the current locale; anything
 * else opens in a new tab without giving the target page access to this one.
 */
export function CmsLink({ href, className, children }: CmsLinkProps) {
  if (isSitePath(href)) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
