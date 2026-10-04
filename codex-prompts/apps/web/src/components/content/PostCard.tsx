import { getTranslations } from 'next-intl/server';

import type { Locale, PostSummaryDto } from '@codex/shared';

import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/i18n/format';
import { Link } from '@/lib/i18n/navigation';
import { postRoute, slugIn } from '@/lib/routes';
import { cn } from '@/lib/utils/cn';

import { MediaImage } from './MediaImage';

interface PostCardProps {
  post: PostSummaryDto;
  locale: Locale;
  headingLevel?: 'h2' | 'h3';
  /** The large card at the top of the blog. */
  isFeatured?: boolean;
  /** First card of a listing: its cover may be the LCP image on phones. */
  isPriority?: boolean;
}

/** A blog card: cover, category, title, excerpt, date and reading time. */
export async function PostCard({
  post,
  locale,
  headingLevel: Heading = 'h3',
  isFeatured = false,
  isPriority = false,
}: PostCardProps) {
  const t = await getTranslations('content');
  const [category] = post.categories;

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg',
        isFeatured && 'lg:grid lg:grid-cols-2',
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-navy-950 lg:aspect-auto lg:min-h-64">
        {post.cover ? (
          <MediaImage
            media={post.cover}
            locale={locale}
            sizes={
              isFeatured
                ? '(min-width: 1024px) 50vw, 100vw'
                : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'
            }
            isFill
            isPriority={isPriority}
            className="transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
      </div>
      <div
        className={cn('flex flex-1 flex-col gap-3 p-6', isFeatured && 'lg:justify-center lg:p-10')}
      >
        {category ? <Badge className="w-fit">{category.name[locale]}</Badge> : null}
        <Heading className={isFeatured ? 'text-3xl' : 'text-xl'}>
          <Link
            href={postRoute(slugIn(post, locale))}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {post.title[locale]}
          </Link>
        </Heading>
        <p className="line-clamp-3 text-muted">{post.excerpt[locale]}</p>
        <p className="mt-auto flex flex-wrap gap-x-3 pt-2 text-sm text-muted">
          {post.publishedAt ? (
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
          ) : null}
          <span aria-hidden>·</span>
          <span>{t('readingTime', { minutes: post.readingTime[locale] })}</span>
        </p>
      </div>
    </article>
  );
}
