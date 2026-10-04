import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';

import { AutomationSection } from '@/components/sections/home/AutomationSection';
import { ClientsMarquee } from '@/components/sections/home/ClientsMarquee';
import { ExpertiseSection } from '@/components/sections/home/ExpertiseSection';
import { FeaturedProjects } from '@/components/sections/home/FeaturedProjects';
import { FinalCta } from '@/components/sections/home/FinalCta';
import { HomeHero } from '@/components/sections/home/HomeHero';
import { LatestPosts } from '@/components/sections/home/LatestPosts';
import { PillarsSection } from '@/components/sections/home/PillarsSection';
import { ProcessSection } from '@/components/sections/home/ProcessSection';
import { StatsSection } from '@/components/sections/home/StatsSection';
import { TeamsSection } from '@/components/sections/home/TeamsSection';
import { TestimonialsSection } from '@/components/sections/home/TestimonialsSection';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteSettings } from '@/lib/api/settings';
import { organizationJsonLd, webSiteJsonLd } from '@/lib/seo/json-ld';
import { SITE_NAME } from '@/lib/seo/metadata';
import { absoluteUrl, localizedUrl } from '@/lib/seo/url';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  // The layout's defaults already describe the home page; keep its title without the suffix.
  return { title: { absolute: t('defaultTitle') } };
}

/** Home (docs/phases/05 §1): twelve sections, alternating dark and light. */
export default async function HomePage() {
  const [locale, settings] = await Promise.all([getLocale(), getSiteSettings()]);
  const homeUrl = localizedUrl(locale, '/');

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd({
            name: settings?.companyName[locale] ?? SITE_NAME,
            url: homeUrl,
            logo: settings?.logo?.url ?? absoluteUrl('/brand/logo.svg'),
            ...(settings && { email: settings.contact.email, phone: settings.contact.phone }),
            sameAs: settings?.socials.map(({ url }) => url) ?? [],
          }),
          webSiteJsonLd({ name: SITE_NAME, url: homeUrl, locale }),
        ]}
      />
      <HomeHero />
      <ClientsMarquee />
      <PillarsSection />
      <ExpertiseSection />
      <AutomationSection />
      <StatsSection />
      <TeamsSection />
      <FeaturedProjects />
      <ProcessSection />
      <TestimonialsSection />
      <LatestPosts />
      <FinalCta />
    </>
  );
}
