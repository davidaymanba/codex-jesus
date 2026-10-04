import { Rss } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';

import { CategoryType, FIELD_LIMITS } from '@codex/shared';

import { DocumentLink } from '@/components/content/DocumentLink';
import { PageCta } from '@/components/content/PageCta';
import { PageHero } from '@/components/content/PageHero';
import { BlogListing } from '@/components/sections/blog/BlogListing';
import { BlogSearch } from '@/components/sections/blog/BlogSearch';
import { withFallback } from '@/lib/api/fallback';
import { getPosts } from '@/lib/api/posts';
import { getCategories } from '@/lib/api/taxonomy';
import { firstParam, listHref, parsePage, type SearchParams } from '@/lib/content/list-params';
import { blogRssRoute, ROUTES } from '@/lib/routes';
import { buildMetadata, localizedPath } from '@/lib/seo/metadata';

const PAGE_SIZE = 9;

interface BlogPageProps {
  searchParams: Promise<SearchParams>;
}

/** `?q=`, `?tag=` and `?page=`, validated (junk pages are 404s). */
async function readListParams(searchParams: Promise<SearchParams>) {
  const params = await searchParams;
  const page = parsePage(params.page);
  if (page === null) notFound();
  // An empty field (`?q=`) is the same as no search.
  const rawQuery = firstParam(params.q)?.trim();
  const rawTag = firstParam(params.tag);
  const query = rawQuery === '' ? undefined : rawQuery;
  const tag = rawTag === '' ? undefined : rawTag;
  const isQueryValid =
    query === undefined ||
    (query.length >= FIELD_LIMITS.SEARCH_QUERY.MIN &&
      query.length <= FIELD_LIMITS.SEARCH_QUERY.MAX);
  return { page, query, tag, isQueryValid };
}

const blogHref = (query: { q?: string | undefined; tag?: string | undefined; page?: number }) =>
  listHref(ROUTES.BLOG, query);

export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('blog.meta')]);
  const { page, query, tag } = await readListParams(searchParams);
  const title = query ? t('searchTitle', { query }) : tag ? t('tagTitle', { tag }) : t('title');
  const metadata = buildMetadata({
    title,
    description: t('description'),
    path: blogHref({ q: query, tag, page }),
    locale,
    // Search and tag views are endless variations of the same posts: kept out of the index.
    isNoIndex: Boolean(query ?? tag),
  });
  const feed = { url: localizedPath(locale, blogRssRoute), title: t('feedTitle') };
  return {
    ...metadata,
    alternates: { ...metadata.alternates, types: { 'application/rss+xml': [feed] } },
  };
}

async function loadListing(params: Awaited<ReturnType<typeof readListParams>>) {
  const { page, query, tag, isQueryValid } = params;
  const isFrontPage = page === 1 && !query && !tag;
  const [categories, listing, featured] = await Promise.all([
    withFallback('blog-categories', () => getCategories(CategoryType.POST), []),
    isQueryValid
      ? getPosts({ query, tag, page, pageSize: PAGE_SIZE })
      : Promise.resolve({ data: [], meta: undefined }),
    isFrontPage
      ? withFallback(
          'blog-featured',
          async () => (await getPosts({ isFeatured: true, pageSize: 1 })).data[0],
          undefined,
        )
      : Promise.resolve(undefined),
  ]);
  const totalPages = listing.meta?.totalPages ?? 1;
  if (page > Math.max(totalPages, 1)) notFound();
  return { categories, posts: listing.data, total: listing.meta?.total ?? 0, totalPages, featured };
}

/** /blog: featured post, categories, server-side search, tags and pagination. */
export default async function BlogPage({ searchParams }: BlogPageProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('blog')]);
  const params = await readListParams(searchParams);
  const { query, tag, page, isQueryValid } = params;
  const { categories, posts, total, totalPages, featured } = await loadListing(params);
  const tagName = tag
    ? (posts
        .flatMap((post) => post.tags)
        .find((candidate) => candidate.slugAr === tag || candidate.slugEn === tag)?.name[locale] ??
      tag)
    : undefined;

  const summary = query ? (
    <p role="status" className="flex flex-wrap items-center gap-3 text-lg">
      {isQueryValid
        ? t('search.results', { count: total, query })
        : t('search.tooShort', { min: FIELD_LIMITS.SEARCH_QUERY.MIN })}
      <DocumentLink href={ROUTES.BLOG} className="text-sm font-medium text-primary underline">
        {t('search.clear')}
      </DocumentLink>
    </p>
  ) : tagName ? (
    <p className="text-lg">{t('tagged', { tag: tagName })}</p>
  ) : undefined;

  return (
    <>
      <PageHero
        locale={locale}
        breadcrumbs={[{ label: t('meta.title'), href: ROUTES.BLOG }]}
        eyebrow={t('hero.eyebrow')}
        title={t('hero.title')}
        description={t('hero.description')}
      >
        <BlogSearch locale={locale} query={query} />
        <a
          href={localizedPath(locale, blogRssRoute)}
          className="inline-flex w-fit items-center gap-2 text-sm text-muted hover:text-fg"
        >
          <Rss aria-hidden className="size-4" />
          {t('rss')}
        </a>
      </PageHero>
      <BlogListing
        locale={locale}
        posts={posts}
        categories={categories}
        featured={featured}
        summary={summary}
        page={page}
        totalPages={totalPages}
        hrefFor={(target) => blogHref({ q: query, tag, page: target })}
      />
      <PageCta />
    </>
  );
}
