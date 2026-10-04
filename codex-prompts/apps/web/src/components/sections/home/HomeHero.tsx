import { ArrowRight } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';

import { CmsLink } from '@/components/content/CmsLink';
import { GlowGradient } from '@/components/shared/GlowGradient';
import { GridPattern } from '@/components/shared/GridPattern';
import { Section } from '@/components/shared/Section';
import { Button } from '@/components/ui/Button';
import { getSiteSettings } from '@/lib/api/settings';
import { ROUTES } from '@/lib/routes';

import { CodeVisual } from './CodeVisual';

/**
 * Home section 1: the page's h1 and main calls to action. Copy comes from the settings
 * (editable in the admin) with the message files as fallback. Server-rendered, no motion and
 * no image, so the headline is the LCP and paints immediately.
 */
export async function HomeHero() {
  const [locale, t, settings] = await Promise.all([
    getLocale(),
    getTranslations('home.hero'),
    getSiteSettings(),
  ]);
  const hero = settings?.homepage.hero;
  const primary = hero
    ? { label: hero.primaryCta.label[locale], href: hero.primaryCta.href }
    : { label: t('primaryCta'), href: ROUTES.QUOTE };
  const secondary = hero
    ? hero.secondaryCta && {
        label: hero.secondaryCta.label[locale],
        href: hero.secondaryCta.href,
      }
    : { label: t('secondaryCta'), href: ROUTES.PORTFOLIO };

  return (
    <Section surface="dark" className="overflow-clip pt-14 pb-24 md:pt-20 md:pb-32">
      <GridPattern />
      <GlowGradient className="start-1/4 -top-48" />
      <GlowGradient className="-end-40 bottom-0 size-[28rem] opacity-60" />
      <div className="grid items-center gap-16 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col items-start gap-6">
          <p className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-primary">
            {hero?.eyebrow[locale] ?? t('eyebrow')}
          </p>
          <h1 className="font-display text-5xl uppercase">{hero?.title[locale] ?? t('title')}</h1>
          <p className="max-w-xl text-xl text-muted">{hero?.subtitle[locale] ?? t('subtitle')}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <CmsLink href={primary.href}>
                {primary.label}
                <ArrowRight aria-hidden className="rtl-flip" />
              </CmsLink>
            </Button>
            {secondary ? (
              <Button asChild size="lg" variant="outline">
                <CmsLink href={secondary.href}>{secondary.label}</CmsLink>
              </Button>
            ) : null}
          </div>
        </div>
        <CodeVisual className="mx-auto w-full max-w-md lg:max-w-none" />
      </div>
    </Section>
  );
}
