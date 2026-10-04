import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@codex/shared';

import { MediaImage } from '@/components/content/MediaImage';
import { PageCta } from '@/components/content/PageCta';
import { PageHero } from '@/components/content/PageHero';
import { RegisterAlternatePaths } from '@/components/layout/AlternatePaths';
import { ProjectGallery } from '@/components/sections/portfolio/ProjectGallery';
import { ProjectMeta } from '@/components/sections/portfolio/ProjectMeta';
import { ProjectNeighbours } from '@/components/sections/portfolio/ProjectNeighbours';
import { JsonLd } from '@/components/seo/JsonLd';
import { Section } from '@/components/shared/Section';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { withFallback } from '@/lib/api/fallback';
import { getAllProjects, getProject } from '@/lib/api/projects';
import { resolveBySlug } from '@/lib/content/resolve-slug';
import { RichText } from '@/lib/rich-text/RichText';
import { localizedPaths, projectRoute, quoteRoute, ROUTES, slugIn } from '@/lib/routes';
import { creativeWorkJsonLd } from '@/lib/seo/json-ld';
import { buildMetadata, SITE_NAME } from '@/lib/seo/metadata';
import { localizedUrl, ogImageOf } from '@/lib/seo/url';

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

const loadProject = (slug: string, locale: Locale) =>
  resolveBySlug({ slug, locale, load: getProject, toPath: projectRoute });

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const [{ slug }, locale, t] = await Promise.all([
    params,
    getLocale(),
    getTranslations('portfolio.meta'),
  ]);
  const project = await loadProject(slug, locale);
  return buildMetadata({
    title: project.seo?.metaTitle?.[locale] ?? project.title[locale],
    description:
      project.seo?.metaDescription?.[locale] ??
      t('categoryDescription', { category: project.industry[locale] }),
    path: localizedPaths(project, projectRoute),
    locale,
    image: ogImageOf(project.ogImage ?? project.cover, locale),
  });
}

/** /portfolio/[slug]: one case study (challenge, solution, results, gallery). */
export default async function ProjectPage({ params }: ProjectPageProps) {
  const [{ slug }, locale, t, tCategories] = await Promise.all([
    params,
    getLocale(),
    getTranslations('portfolio'),
    getTranslations('serviceCategories'),
  ]);
  const project = await loadProject(slug, locale);
  const path = projectRoute(slugIn(project, locale));
  const all = await withFallback('project-neighbours', getAllProjects, []);
  const position = all.findIndex(({ id }) => id === project.id);
  const total = project.gallery.length;

  return (
    <>
      <RegisterAlternatePaths {...localizedPaths(project, projectRoute)} />
      <JsonLd
        data={creativeWorkJsonLd({
          name: project.title[locale],
          description: project.industry[locale],
          url: localizedUrl(locale, path),
          image: project.cover?.url,
          datePublished: project.publishedAt ?? undefined,
          dateModified: project.updatedAt,
          creatorName: SITE_NAME,
          creatorUrl: localizedUrl(locale, ROUTES.HOME),
          keywords: [...project.categories.map(({ name }) => name[locale]), ...project.techStack],
          locale,
        })}
      />
      <PageHero
        locale={locale}
        breadcrumbs={[
          { label: t('meta.title'), href: ROUTES.PORTFOLIO },
          { label: project.title[locale], href: path },
        ]}
        eyebrow={tCategories(project.serviceCategory)}
        title={project.title[locale]}
        description={project.industry[locale]}
        className="pb-40 md:pb-56"
      />
      <Section surface="white" className="flow-root pt-0 md:pt-0">
        {project.cover ? (
          <div className="relative -mt-32 overflow-hidden rounded-3xl border border-border shadow-lg md:-mt-44">
            <MediaImage
              media={project.cover}
              locale={locale}
              sizes="(min-width: 1280px) 75rem, 100vw"
              isPriority
              className="h-auto w-full"
            />
          </div>
        ) : null}
        <div className="mt-12">
          <ProjectMeta project={project} locale={locale} />
        </div>
        <div className="mt-16 grid gap-14 lg:grid-cols-2">
          <article>
            <h2 className="mb-6 text-3xl">{t('detail.challenge')}</h2>
            <RichText doc={project.challenge[locale]} locale={locale} />
          </article>
          <article>
            <h2 className="mb-6 text-3xl">{t('detail.solution')}</h2>
            <RichText doc={project.solution[locale]} locale={locale} />
          </article>
        </div>
      </Section>

      {project.results.length > 0 ? (
        <Section surface="dark">
          <SectionHeading eyebrow={t('detail.resultsEyebrow')} title={t('detail.resultsTitle')} />
          <dl className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {project.results.map((result) => (
              <div
                key={result.metric.en}
                className="flex flex-col-reverse gap-3 rounded-3xl border border-border bg-card p-8"
              >
                <dt className="text-lg text-muted">{result.metric[locale]}</dt>
                <dd className="font-display text-6xl text-accent">{result.value[locale]}</dd>
              </div>
            ))}
          </dl>
        </Section>
      ) : null}

      {total > 0 ? (
        <Section surface="light">
          <SectionHeading eyebrow={t('detail.galleryEyebrow')} title={t('detail.galleryTitle')} />
          <div className="mt-12">
            <ProjectGallery
              images={project.gallery.map((media) => ({
                id: media.id,
                url: media.url,
                alt: media.alt[locale],
                width: media.width,
                height: media.height,
              }))}
              labels={{
                open: project.gallery.map((media, index) =>
                  t('gallery.open', { index: index + 1, total, alt: media.alt[locale] }),
                ),
                counter: project.gallery.map((_, index) =>
                  t('gallery.counter', { index: index + 1, total }),
                ),
                close: t('gallery.close'),
                previous: t('gallery.previous'),
                next: t('gallery.next'),
              }}
            />
          </div>
        </Section>
      ) : null}

      {position === -1 ? null : (
        <ProjectNeighbours locale={locale} previous={all[position - 1]} next={all[position + 1]} />
      )}
      <PageCta quoteHref={quoteRoute(project.serviceCategory)} />
    </>
  );
}
