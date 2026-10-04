import { ArrowRight, Check } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';

import type { ServiceCategory, ServiceDto } from '@codex/shared';

import { ServiceIcon } from '@/components/content/ServiceIcon';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { Section, type Surface } from '@/components/shared/Section';
import { Button } from '@/components/ui/Button';
import { OFFERINGS_BY_PILLAR } from '@/lib/content/offerings';
import { Link } from '@/lib/i18n/navigation';
import { pillarAnchor, quoteRoute, serviceRoute, slugIn } from '@/lib/routes';

interface PillarSectionProps {
  category: ServiceCategory;
  /** The pillar's published service; without it the message files describe the pillar. */
  service: ServiceDto | null;
  surface: Surface;
}

/**
 * One pillar on /services, at a stable anchor (`#development`…) that the footer and the
 * navigation can link to even when the API is down.
 */
export async function PillarSection({ category, service, surface }: PillarSectionProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);
  const title = service?.title[locale] ?? t(`serviceCategories.${category}`);
  const items = service
    ? service.subServices.map(({ title: item, description }) => ({
        title: item[locale],
        description: description[locale],
      }))
    : OFFERINGS_BY_PILLAR[category].map((offering) => ({
        title: t(`offerings.${offering}.title`),
        description: t(`offerings.${offering}.description`),
      }));

  return (
    <Section surface={surface} id={pillarAnchor(category)} aria-labelledby={`${category}-title`}>
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col items-start gap-6 lg:sticky lg:top-28 lg:self-start">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <ServiceIcon name={service?.icon ?? 'code-xml'} className="size-7" />
          </span>
          <h2 id={`${category}-title`} className="text-4xl">
            {title}
          </h2>
          <p className="text-lg text-muted">
            {service?.shortDescription[locale] ?? t(`serviceCategoryDescriptions.${category}`)}
          </p>
          <div className="flex flex-wrap gap-3">
            {service ? (
              <Button asChild>
                <Link href={serviceRoute(slugIn(service, locale))}>
                  {t('services.pillar.explore', { service: title })}
                  <ArrowRight aria-hidden className="rtl-flip" />
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href={quoteRoute(category)}>{t('services.pillar.quote')}</Link>
            </Button>
          </div>
        </div>
        <div>
          <h3 className="mb-6 font-sans text-sm font-medium tracking-wide text-muted uppercase">
            {t('services.pillar.includes')}
          </h3>
          <Stagger className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <StaggerItem key={item.title}>
                <div className="flex h-full gap-3 rounded-2xl border border-border bg-card p-5">
                  <Check aria-hidden className="mt-1 size-5 shrink-0 text-primary" />
                  <div className="flex flex-col gap-1">
                    <h4 className="text-lg">{item.title}</h4>
                    <p className="text-sm text-muted">{item.description}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </Section>
  );
}
