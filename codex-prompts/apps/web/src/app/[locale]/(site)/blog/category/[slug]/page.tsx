import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';

import { CategoryType, type CategoryDto, type Locale } from '@codex/shared';

import { PageCta } from '@/components/content/PageCta';
import { PageHero } from '@/components/content/PageHero';
import { RegisterAlternatePaths } from '@/components/layout/AlternatePaths';
import { BlogListing } from '@/components/sections/blog/BlogListing';
import { getPosts } from '@/lib/api/posts';
import { getCategories } from '@/lib/api/taxonomy';
import { listHref, parsePage, type SearchParams } from '@/lib/content/list-params';
import { resolveBySlug } from '@/lib/content/resolve-slug';
import { blogCategoryRoute, localizedPaths, ROUTES, slugIn } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';

const PAGE_SIZE = 9;

interface BlogCategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}

const findCategory = async (slug: string, locale: Locale): Promise<CategoryDto | null> =>
  (await getCategories(CategoryType.POST)).find((category) => slugIn(category, locale) === slug) ??
  null;

async function resolvePage({ params, searchParams }: BlogCategoryPageProps, locale: Locale) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const category = await resolveBySlug({
    slug,
    locale,
    load: findCategory,
    toPath: blogCategoryRoute,
  });
  const page = parsePage(query.page);
  if (page === null) notFound();
  return { category, page };
}

export async function generateMetadata(props: BlogCategoryPageProps): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('blog.meta')]);
  const { category, page } = await resolvePage(props, locale);
  const pathIn = (target: Locale) =>
    listHref(blogCategoryRoute(slugIn(category, target)), { page });
  return buildMetadata({
    title: t('categoryTitle', { category: category.name[locale] }),
    description: t('categoryDescription', { category: category.name[locale] }),
    path: { ar: pathIn('ar'), en: pathIn('en') },
    locale,
  });
}

/** /blog/category/[slug]: an indexable list of one category's posts. */
export default async function BlogCategoryPage(props: BlogCategoryPageProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('blog')]);
  const { category, page } = await resolvePage(props, locale);
  const path = blogCategoryRoute(slugIn(category, locale));
  const [categories, listing] = await Promise.all([
    getCategories(CategoryType.POST),
    getPosts({ category: slugIn(category, locale), page, pageSize: PAGE_SIZE }),
  ]);
  const totalPages = listing.meta?.totalPages ?? 1;
  if (page > Math.max(totalPages, 1)) notFound();
  const name = category.name[locale];

  return (
    <>
      <RegisterAlternatePaths {...localizedPaths(category, blogCategoryRoute)} />
      <PageHero
        locale={locale}
        breadcrumbs={[
          { label: t('meta.title'), href: ROUTES.BLOG },
          { label: name, href: path },
        ]}
        eyebrow={t('hero.eyebrow')}
        title={t('meta.categoryTitle', { category: name })}
        description={t('meta.categoryDescription', { category: name })}
      />
      <BlogListing
        locale={locale}
        posts={listing.data}
        categories={categories}
        activeCategoryId={category.id}
        page={page}
        totalPages={totalPages}
        hrefFor={(target) => listHref(path, { page: target })}
      />
      <PageCta />
    </>
  );
}
