import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';

import { PageCta } from '@/components/content/PageCta';
import { PageHero } from '@/components/content/PageHero';
import { ProcessSection } from '@/components/sections/home/ProcessSection';
import { PillarSection } from '@/components/sections/services/PillarSection';
import { WhyCodexSection } from '@/components/sections/shared/WhyCodexSection';
import { withFallback } from '@/lib/api/fallback';
import { getNavigationServices, getService } from '@/lib/api/services';
import { PILLARS } from '@/lib/content/offerings';
import { ROUTES, slugIn } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('services.meta')]);
  return buildMetadata({
    title: t('title'),
    description: t('description'),
    path: ROUTES.SERVICES,
    locale,
  });
}

/** /services: the three pillars with what each includes, why Codex, the process and a CTA. */
export default async function ServicesPage() {
  const [locale, t, tMeta, services] = await Promise.all([
    getLocale(),
    getTranslations('services.hero'),
    getTranslations('services.meta'),
    getNavigationServices(),
  ]);
  // The pillar pages hold the sub-services; one cached request each.
  const pillars = await Promise.all(
    PILLARS.map(async (category) => {
      const summary = services.find((service) => service.category === category);
      const service = summary
        ? await withFallback(
            'services-pillar',
            () => getService(slugIn(summary, locale), locale),
            null,
          )
        : null;
      return { category, service };
    }),
  );

  return (
    <>
      <PageHero
        locale={locale}
        breadcrumbs={[{ label: tMeta('title'), href: ROUTES.SERVICES }]}
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
      />
      {pillars.map(({ category, service }, index) => (
        <PillarSection
          key={category}
          category={category}
          service={service}
          surface={index % 2 === 0 ? 'light' : 'dark'}
        />
      ))}
      <WhyCodexSection surface="dark" />
      <ProcessSection surface="light" />
      <PageCta />
    </>
  );
}
