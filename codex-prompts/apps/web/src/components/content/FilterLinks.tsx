import { cn } from '@/lib/utils/cn';

import { DocumentLink } from './DocumentLink';

export interface FilterLink {
  key: string;
  label: string;
  /** Path (with query) without the locale prefix. */
  href: string;
  isActive: boolean;
}

/**
 * Filters as plain links, so every filtered view has its own crawlable, shareable URL and
 * works without JavaScript.
 */
export function FilterLinks({ label, links }: { label: string; links: FilterLink[] }) {
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.key}>
            <DocumentLink
              href={link.href}
              aria-current={link.isActive ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-medium transition-colors',
                link.isActive
                  ? 'border-primary bg-primary text-bg'
                  : 'border-border bg-card hover:border-primary hover:text-primary',
              )}
            >
              {link.label}
            </DocumentLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
