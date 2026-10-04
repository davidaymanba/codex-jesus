import { CircleCheck, Layers } from 'lucide-react';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@codex/shared';

import { FaqList } from '@/components/content/FaqList';
import { PageCta } from '@/components/content/PageCta';
import { PageHero } from '@/components/content/PageHero';
import { ProjectCard } from '@/components/content/ProjectCard';
import { RegisterAlternatePaths } from '@/components/layout/AlternatePaths';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { ProcessSection } from '@/components/sections/home/ProcessSection';
import { JsonLd } from '@/components/seo/JsonLd';
import { Section } from '@/components/shared/Section';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Button } from '@/components/ui/Button';
import { withFallback } from '@/lib/api/fallback';
import { getProjects } from '@/lib/api/projects';
import { getService } from '@/lib/api/services';
import { resolveBySlug } from '@/lib/content/resolve-slug';
import { Link } from '@/lib/i18n/navigation';
import { RichText } from '@/lib/rich-text/RichText';
import { localizedPaths, quoteRoute, ROUTES, serviceRoute, slugIn } from '@/lib/routes';
import { faqPageJsonLd, serviceJsonLd } from '@/lib/seo/json-ld';
import { buildMetadata, SITE_NAME } from '@/lib/seo/metadata';
import { localizedUrl, ogImageOf } from '@/lib/seo/url';

const RELATED_LIMIT = 3;

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

const loadService = async (slug: string, locale: Locale) =>
  resolveBySlug({ slug, locale, load: getService, toPath: serviceRoute });

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const service = await loadService(slug, locale);
  return buildMetadata({
    title: service.seo?.metaTitle?.[locale] ?? service.title[locale],
    description: service.seo?.metaDescription?.[locale] ?? service.shortDescription[locale],
    path: localizedPaths(service, serviceRoute),
    locale,
    image: ogImageOf(service.ogImage ?? service.cover, locale),
  });
}

/** /services/[slug]: one service with its sub-services, benefits, related work and FAQ. */
export default async function ServicePage({ params }: ServicePageProps) {
  const [{ slug }, locale, t, tServices] = await Promise.all([
    params,
    getLocale(),
    getTranslations(),
    getTranslations('services.detail'),
  ]);
  const service = await loadService(slug, locale);
  const title = service.title[locale];
  const path = serviceRoute(slugIn(service, locale));
  const related = await withFallback(
    'service-related-projects',
    async () =>
      (await getProjects({ serviceCategory: service.category, pageSize: RELATED_LIMIT })).data,
    [],
  );
  const faqs = service.faqs.map(({ question, answer }) => ({
    question: question[locale],
    answer: answer[locale],
  }));
  const hasContent = service.content[locale].content.length > 0;

  return (
    <>
      <RegisterAlternatePaths {...localizedPaths(service, serviceRoute)} />
      <JsonLd
        data={[
          serviceJsonLd({
            name: title,
            description: service.shortDescription[locale],
            url: localizedUrl(locale, path),
            providerName: SITE_NAME,
            providerUrl: localizedUrl(locale, ROUTES.HOME),
          }),
          ...(faqs.length > 0 ? [faqPageJsonLd(faqs)] : []),
        ]}
      />
      <PageHero
        locale={locale}
        breadcrumbs={[
          { label: t('services.meta.title'), href: ROUTES.SERVICES },
          { label: title, href: path },
        ]}
        eyebrow={t(`serviceCategories.${service.category}`)}
        title={title}
        description={service.shortDescription[locale]}
      >
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href={quoteRoute(service.category)}>
              {tServices('quote', { service: title })}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={ROUTES.CONTACT}>{tServices('contact')}</Link>
          </Button>
        </div>
      </PageHero>

      {hasContent ? (
        <Section surface="white">
          <p className="mb-6 text-sm font-medium tracking-wide text-primary uppercase">
            {tServices('overviewEyebrow')}
          </p>
          <RichText doc={service.content[locale]} locale={locale} />
        </Section>
      ) : null}

      {service.subServices.length > 0 ? (
        <Section surface="dark">
          <SectionHeading
            eyebrow={tServices('subServicesEyebrow')}
            title={tServices('subServicesTitle', { service: title })}
          />
          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {service.subServices.map((item) => (
              <StaggerItem key={item.title.en}>
                <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-6">
                  <Layers aria-hidden className="size-6 text-primary" />
                  <h3 className="text-xl">{item.title[locale]}</h3>
                  <p className="text-muted">{item.description[locale]}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Section>
      ) : null}

      {service.benefits.length > 0 ? (
        <Section surface="light">
          <SectionHeading
            eyebrow={tServices('benefitsEyebrow')}
            title={tServices('benefitsTitle')}
          />
          <ul className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {service.benefits.map((benefit) => (
              <li key={benefit.title.en} className="flex gap-4">
                <CircleCheck aria-hidden className="mt-1 size-6 shrink-0 text-primary" />
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl">{benefit.title[locale]}</h3>
                  <p className="text-muted">{benefit.description[locale]}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <ProcessSection surface="white" />

      {related.length > 0 ? (
        <Section surface="dark">
          <SectionHeading
            eyebrow={tServices('relatedEyebrow')}
            title={tServices('relatedTitle', { service: title })}
          />
          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((project) => (
              <StaggerItem key={project.id}>
                <ProjectCard project={project} locale={locale} />
              </StaggerItem>
            ))}
          </Stagger>
        </Section>
      ) : null}

      {faqs.length > 0 ? (
        <Section surface="light">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
            <SectionHeading eyebrow={tServices('faqEyebrow')} title={tServices('faqTitle')} />
            <FaqList items={faqs} />
          </div>
        </Section>
      ) : null}

      <PageCta quoteHref={quoteRoute(service.category)} />
    </>
  );
}
