import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import type { Locale, ProjectSummaryDto } from '@codex/shared';

import { Container } from '@/components/shared/Container';
import { Link } from '@/lib/i18n/navigation';
import { projectRoute, ROUTES, slugIn } from '@/lib/routes';
import { cn } from '@/lib/utils/cn';

interface ProjectNeighboursProps {
  locale: Locale;
  previous: ProjectSummaryDto | undefined;
  next: ProjectSummaryDto | undefined;
}

const linkClasses =
  'group flex flex-col gap-1 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary';

/** Previous / next case study in display order, and the way back to the list. */
export async function ProjectNeighbours({ locale, previous, next }: ProjectNeighboursProps) {
  const t = await getTranslations('portfolio.detail');
  return (
    <nav aria-label={t('all')} className="surface-white py-12">
      <Container className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
        {previous ? (
          <Link href={projectRoute(slugIn(previous, locale))} className={linkClasses} rel="prev">
            <span className="flex items-center gap-2 text-sm text-muted">
              <ArrowLeft aria-hidden className="size-4 rtl-flip" />
              {t('previous')}
            </span>
            <span className="font-medium">{previous.title[locale]}</span>
          </Link>
        ) : (
          <span />
        )}
        <Link href={ROUTES.PORTFOLIO} className="justify-self-center font-medium text-primary">
          {t('all')}
        </Link>
        {next ? (
          <Link
            href={projectRoute(slugIn(next, locale))}
            className={cn(linkClasses, 'md:items-end md:text-end')}
            rel="next"
          >
            <span className="flex items-center gap-2 text-sm text-muted">
              {t('next')}
              <ArrowRight aria-hidden className="size-4 rtl-flip" />
            </span>
            <span className="font-medium">{next.title[locale]}</span>
          </Link>
        ) : null}
      </Container>
    </nav>
  );
}
