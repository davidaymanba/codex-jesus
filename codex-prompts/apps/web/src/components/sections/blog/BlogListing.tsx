import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import type { CategoryDto, Locale, PostSummaryDto } from '@codex/shared';

import { DocumentLink } from '@/components/content/DocumentLink';
import { EmptyState } from '@/components/content/EmptyState';
import { FilterLinks } from '@/components/content/FilterLinks';
import { Pagination } from '@/components/content/Pagination';
import { PostCard } from '@/components/content/PostCard';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { Section } from '@/components/shared/Section';
import { Button } from '@/components/ui/Button';
import { blogCategoryRoute, ROUTES, slugIn } from '@/lib/routes';

interface BlogListingProps {
  locale: Locale;
  posts: PostSummaryDto[];
  categories: CategoryDto[];
  activeCategoryId?: string | undefined;
  /** Shown above the grid on the blog's first page. */
  featured?: PostSummaryDto | undefined;
  /** A line above the grid (search results count, active tag). */
  summary?: ReactNode;
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}

/** The blog's list views (all, category, tag, search): filters, featured post, grid, pages. */
export async function BlogListing({
  locale,
  posts,
  categories,
  activeCategoryId,
  featured,
  summary,
  page,
  totalPages,
  hrefFor,
}: BlogListingProps) {
  const t = await getTranslations('blog');
  const grid = featured ? posts.filter(({ id }) => id !== featured.id) : posts;

  return (
    <Section surface="light">
      <FilterLinks
        label={t('filters.label')}
        links={[
          { key: 'all', label: t('filters.all'), href: ROUTES.BLOG, isActive: !activeCategoryId },
          ...categories.map((category) => ({
            key: category.id,
            label: category.name[locale],
            href: blogCategoryRoute(slugIn(category, locale)),
            isActive: category.id === activeCategoryId,
          })),
        ]}
      />
      {summary ? <div className="mt-8">{summary}</div> : null}
      {featured ? (
        <div className="mt-10">
          <PostCard post={featured} locale={locale} headingLevel="h2" isFeatured isPriority />
        </div>
      ) : null}
      {grid.length > 0 ? (
        <Stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {grid.map((post, index) => (
            <StaggerItem key={post.id}>
              <PostCard
                post={post}
                locale={locale}
                headingLevel="h2"
                isPriority={!featured && index === 0}
              />
            </StaggerItem>
          ))}
        </Stagger>
      ) : featured ? null : (
        <div className="mt-10">
          <EmptyState
            title={t('empty.title')}
            description={t('empty.description')}
            action={
              <Button asChild variant="outline">
                <DocumentLink href={ROUTES.BLOG}>{t('empty.action')}</DocumentLink>
              </Button>
            }
          />
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
    </Section>
  );
}
