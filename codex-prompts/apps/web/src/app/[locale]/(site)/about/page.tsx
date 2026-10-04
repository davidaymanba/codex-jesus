import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';

import { PageCta } from '@/components/content/PageCta';
import { PageHero } from '@/components/content/PageHero';
import { MissionVision } from '@/components/sections/about/MissionVision';
import { StorySection } from '@/components/sections/about/StorySection';
import { TeamGrid } from '@/components/sections/about/TeamGrid';
import { ValuesSection } from '@/components/sections/about/ValuesSection';
import { StatsSection } from '@/components/sections/home/StatsSection';
import { TeamsSection } from '@/components/sections/home/TeamsSection';
import { WhyCodexSection } from '@/components/sections/shared/WhyCodexSection';
import { ROUTES } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('about.meta')]);
  return buildMetadata({
    title: t('title'),
    description: t('description'),
    path: ROUTES.ABOUT,
    locale,
  });
}

/** /about: story, mission and vision, values, the teams and their people, numbers, why us. */
export default async function AboutPage() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('about')]);
  return (
    <>
      <PageHero
        locale={locale}
        breadcrumbs={[{ label: t('meta.title'), href: ROUTES.ABOUT }]}
        eyebrow={t('hero.eyebrow')}
        title={t('hero.title')}
        description={t('hero.description')}
      />
      <StorySection />
      <MissionVision />
      <ValuesSection />
      <TeamsSection id="teams" surface="dark" />
      <TeamGrid />
      <StatsSection surface="dark" />
      <WhyCodexSection surface="light" />
      <PageCta />
    </>
  );
}
