import { ArrowRight } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';

import { ServiceIcon } from '@/components/content/ServiceIcon';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { Section } from '@/components/shared/Section';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { getNavigationServices } from '@/lib/api/services';
import { PILLARS } from '@/lib/content/offerings';
import { Link } from '@/lib/i18n/navigation';
import { pillarRoute, serviceRoute, slugIn } from '@/lib/routes';

const PILLAR_ICONS = { DEVELOPMENT: 'code-xml', BRANDING: 'palette', MARKETING: 'megaphone' };

/** Home section 3: the three service pillars, each linking to its service page. */
export async function PillarsSection() {
  const [locale, t, services] = await Promise.all([
    getLocale(),
    getTranslations(),
    getNavigationServices(),
  ]);
  // The first published service of each pillar; the message files cover a missing one.
  const pillars = PILLARS.map((category) => {
    const service = services.find((candidate) => candidate.category === category);
    return service
      ? {
          category,
          icon: service.icon,
          title: service.title[locale],
          description: service.shortDescription[locale],
          href: serviceRoute(slugIn(service, locale)),
        }
      : {
          category,
          icon: PILLAR_ICONS[category],
          title: t(`serviceCategories.${category}`),
          description: t(`serviceCategoryDescriptions.${category}`),
          href: pillarRoute(category),
        };
  });

  return (
    <Section surface="light">
      <SectionHeading
        eyebrow={t('home.pillars.eyebrow')}
        title={t('home.pillars.title')}
        description={t('home.pillars.description')}
      />
      <Stagger className="mt-12 grid gap-6 lg:grid-cols-3">
        {pillars.map((pillar) => (
          <StaggerItem key={pillar.category}>
            <article className="group relative flex h-full flex-col gap-5 rounded-3xl border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-lg md:p-10">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <ServiceIcon name={pillar.icon} className="size-7" />
              </span>
              <h3 className="text-3xl">{pillar.title}</h3>
              <p className="text-muted">{pillar.description}</p>
              <Link
                href={pillar.href}
                className="mt-auto inline-flex items-center gap-2 font-medium text-primary after:absolute after:inset-0 after:content-['']"
              >
                {t('home.pillars.explore', { service: pillar.title })}
                <ArrowRight
                  aria-hidden
                  className="size-4 rtl-flip transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                />
              </Link>
            </article>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
