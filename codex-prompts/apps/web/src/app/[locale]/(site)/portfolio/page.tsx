import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';

import { CategoryType, type CategoryDto, type Locale } from '@codex/shared';

import { EmptyState } from '@/components/content/EmptyState';
import { FilterLinks } from '@/components/content/FilterLinks';
import { PageCta } from '@/components/content/PageCta';
import { PageHero } from '@/components/content/PageHero';
import { Pagination } from '@/components/content/Pagination';
import { ProjectCard } from '@/components/content/ProjectCard';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { Section } from '@/components/shared/Section';
import { Button } from '@/components/ui/Button';
import { getProjects } from '@/lib/api/projects';
import { getCategories } from '@/lib/api/taxonomy';
import {
  firstParam,
  listHref,
  matchCategory,
  parsePage,
  type SearchParams,
} from '@/lib/content/list-params';
import { Link, permanentRedirect } from '@/lib/i18n/navigation';
import { ROUTES, slugIn } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';

const PAGE_SIZE = 9;

interface PortfolioPageProps {
  searchParams: Promise<SearchParams>;
}

const portfolioHref = (category: CategoryDto | undefined, locale: Locale, page?: number) =>
  listHref(ROUTES.PORTFOLIO, { category: category && slugIn(category, locale), page });

/** The listing's filter and page, validated; junk URLs are 404s, old slugs redirect. */
async function resolveListing(searchParams: Promise<SearchParams>, locale: Locale) {
  const [params, categories] = await Promise.all([
    searchParams,
    getCategories(CategoryType.PROJECT),
  ]);
  const page = parsePage(params.page);
  const match = matchCategory(categories, firstParam(params.category), locale);
  if (page === null || match.kind === 'unknown') notFound();
  if (match.kind === 'other-locale') {
    permanentRedirect({ href: portfolioHref(match.category, locale, page), locale });
  }
  const category = match.kind === 'found' ? match.category : undefined;
  return { categories, category, page };
}

export async function generateMetadata({ searchParams }: PortfolioPageProps): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('portfolio.meta')]);
  const { category, page } = await resolveListing(searchParams, locale);
  const name = category?.name[locale];
  return buildMetadata({
    title: name ? t('categoryTitle', { category: name }) : t('title'),
    description: name ? t('categoryDescription', { category: name }) : t('description'),
    path: { ar: portfolioHref(category, 'ar', page), en: portfolioHref(category, 'en', page) },
    locale,
  });
}

/** /portfolio: case studies, filtered by category with plain links, paginated. */
export default async function PortfolioPage({ searchParams }: PortfolioPageProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('portfolio')]);
  const { categories, category, page } = await resolveListing(searchParams, locale);
  const { data: projects, meta } = await getProjects({
    category: category && slugIn(category, locale),
    page,
    pageSize: PAGE_SIZE,
  });
  const totalPages = meta?.totalPages ?? 1;
  if (page > Math.max(totalPages, 1)) notFound();

  return (
    <>
      <PageHero
        locale={locale}
        breadcrumbs={[
          { label: t('meta.title'), href: ROUTES.PORTFOLIO },
          ...(category
            ? [{ label: category.name[locale], href: portfolioHref(category, locale) }]
            : []),
        ]}
        eyebrow={t('hero.eyebrow')}
        title={
          category ? t('meta.categoryTitle', { category: category.name[locale] }) : t('hero.title')
        }
        description={t('hero.description')}
      />
      <Section surface="light">
        <FilterLinks
          label={t('filters.label')}
          links={[
            { key: 'all', label: t('filters.all'), href: ROUTES.PORTFOLIO, isActive: !category },
            ...categories.map((candidate) => ({
              key: candidate.id,
              label: candidate.name[locale],
              href: portfolioHref(candidate, locale),
              isActive: candidate.id === category?.id,
            })),
          ]}
        />
        {projects.length > 0 ? (
          <Stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <StaggerItem key={project.id}>
                <ProjectCard
                  project={project}
                  locale={locale}
                  headingLevel="h2"
                  isPriority={index === 0}
                />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <div className="mt-10">
            <EmptyState
              title={t('empty.title')}
              description={t('empty.description')}
              action={
                category ? (
                  <Button asChild variant="outline">
                    <Link href={ROUTES.PORTFOLIO}>{t('empty.action')}</Link>
                  </Button>
                ) : undefined
              }
            />
          </div>
        )}
        <Pagination
          page={page}
          totalPages={totalPages}
          hrefFor={(target) => portfolioHref(category, locale, target)}
        />
      </Section>
      <PageCta />
    </>
  );
}
