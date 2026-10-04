import { ChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import type { Locale } from '@codex/shared';

import { JsonLd } from '@/components/seo/JsonLd';
import { Link } from '@/lib/i18n/navigation';
import { ROUTES } from '@/lib/routes';
import { breadcrumbJsonLd } from '@/lib/seo/json-ld';
import { localizedUrl } from '@/lib/seo/url';

export interface Crumb {
  label: string;
  /** Path without the locale prefix; the last crumb is the current page. */
  href: string;
}

/** Visible trail (home first, current page last) plus its BreadcrumbList structured data. */
export async function Breadcrumbs({ items, locale }: { items: Crumb[]; locale: Locale }) {
  const t = await getTranslations('content');
  const trail = [{ label: t('home'), href: ROUTES.HOME }, ...items];
  const lastIndex = trail.length - 1;

  return (
    <>
      <nav aria-label={t('breadcrumbs')}>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
          {trail.map((crumb, index) => (
            <li key={crumb.href} className="flex items-center gap-2">
              {index > 0 ? <ChevronRight aria-hidden className="size-4 rtl-flip" /> : null}
              {index === lastIndex ? (
                <span aria-current="page" className="line-clamp-1 text-fg">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="transition-colors hover:text-fg">
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={breadcrumbJsonLd(
          trail.map(({ label, href }) => ({ name: label, url: localizedUrl(locale, href) })),
        )}
      />
    </>
  );
}
