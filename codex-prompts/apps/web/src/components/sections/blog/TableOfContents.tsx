import { ChevronDown } from 'lucide-react';

import type { TocHeading } from '@/lib/rich-text/headings';
import { cn } from '@/lib/utils/cn';

function TocLinks({ headings }: { headings: TocHeading[] }) {
  return (
    <ol className="flex flex-col gap-2 text-sm">
      {headings.map((heading) => (
        <li key={heading.id} className={cn(heading.level === 3 && 'ps-4')}>
          <a href={`#${heading.id}`} className="text-muted transition-colors hover:text-primary">
            {heading.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

/**
 * Links to the article's h2/h3 headings (ids from the rich-text renderer). Sticky beside the
 * article on large screens; a collapsed disclosure above it on phones. No JavaScript.
 */
export function TableOfContents({ headings, title }: { headings: TocHeading[]; title: string }) {
  if (headings.length < 2) return null;
  return (
    <>
      <details className="group rounded-2xl border border-border bg-card p-5 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between font-medium [&::-webkit-details-marker]:hidden">
          {title}
          <ChevronDown aria-hidden className="size-5 transition-transform group-open:rotate-180" />
        </summary>
        <nav aria-label={title} className="mt-4">
          <TocLinks headings={headings} />
        </nav>
      </details>
      <nav aria-label={title} className="sticky top-28 hidden lg:block">
        <p className="mb-4 font-sans text-sm font-medium tracking-wide text-muted uppercase">
          {title}
        </p>
        <TocLinks headings={headings} />
      </nav>
    </>
  );
}
