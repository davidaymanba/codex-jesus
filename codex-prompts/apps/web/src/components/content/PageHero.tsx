import type { ReactNode } from 'react';

import type { Locale } from '@codex/shared';

import { BracketDecor } from '@/components/shared/BracketDecor';
import { GlowGradient } from '@/components/shared/GlowGradient';
import { GridPattern } from '@/components/shared/GridPattern';
import { Section } from '@/components/shared/Section';
import { cn } from '@/lib/utils/cn';

import { Breadcrumbs, type Crumb } from './Breadcrumbs';

interface PageHeroProps {
  locale: Locale;
  breadcrumbs: Crumb[];
  title: string;
  eyebrow?: string | undefined;
  description?: string | undefined;
  /** Actions, meta or a search box under the description. */
  children?: ReactNode;
  className?: string;
}

/**
 * The dark opening section of every inner page: breadcrumbs and the page's only h1. No reveal
 * animation: this is above the fold and usually holds the LCP element.
 */
export function PageHero({
  locale,
  breadcrumbs,
  title,
  eyebrow,
  description,
  children,
  className,
}: PageHeroProps) {
  return (
    <Section surface="dark" className={cn('overflow-clip pt-8 pb-16 md:pt-12 md:pb-20', className)}>
      <GridPattern />
      <GlowGradient className="start-1/3 -top-72" />
      <BracketDecor className="absolute end-4 top-16 hidden size-56 lg:block" />
      <Breadcrumbs items={breadcrumbs} locale={locale} />
      <div className="mt-10 flex max-w-3xl flex-col gap-5">
        {eyebrow ? (
          <p className="text-sm font-medium tracking-wide text-primary uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="text-5xl">{title}</h1>
        {description ? <p className="text-xl text-muted">{description}</p> : null}
        {children}
      </div>
    </Section>
  );
}
