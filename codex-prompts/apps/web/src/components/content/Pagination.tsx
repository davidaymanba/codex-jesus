import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { cn } from '@/lib/utils/cn';

import { DocumentLink } from './DocumentLink';
import { pageItems } from './page-items';

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Path (with query) of a page number, without the locale prefix. */
  hrefFor: (page: number) => string;
}

const itemClasses =
  'inline-flex size-11 items-center justify-center rounded-full border border-border text-sm font-medium transition-colors hover:border-primary hover:text-primary';

/** Plain links (crawlable, no JS): previous, numbered pages, next. */
export async function Pagination({ page, totalPages, hrefFor }: PaginationProps) {
  if (totalPages <= 1) return null;
  const t = await getTranslations('content.pagination');
  const items = pageItems(page, totalPages);

  return (
    <nav aria-label={t('label')} className="mt-12 flex justify-center">
      <ul className="flex flex-wrap items-center gap-2">
        {page > 1 ? (
          <li>
            <DocumentLink
              href={hrefFor(page - 1)}
              rel="prev"
              aria-label={t('previous')}
              className={itemClasses}
            >
              <ChevronLeft aria-hidden className="size-5 rtl-flip" />
            </DocumentLink>
          </li>
        ) : null}
        {items.map((item, index) =>
          item === 'gap' ? (
            // A gap is identified by the page that follows it.
            <li key={`gap-${String(items[index + 1])}`} aria-hidden className="px-1 text-muted">
              …
            </li>
          ) : (
            <li key={item}>
              <DocumentLink
                href={hrefFor(item)}
                aria-label={t('page', { page: item })}
                aria-current={item === page ? 'page' : undefined}
                className={cn(
                  itemClasses,
                  item === page && 'border-primary bg-primary text-bg hover:text-bg',
                )}
              >
                {item}
              </DocumentLink>
            </li>
          ),
        )}
        {page < totalPages ? (
          <li>
            <DocumentLink
              href={hrefFor(page + 1)}
              rel="next"
              aria-label={t('next')}
              className={itemClasses}
            >
              <ChevronRight aria-hidden className="size-5 rtl-flip" />
            </DocumentLink>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
