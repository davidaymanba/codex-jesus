import { ArrowRight } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';

import { PostCard } from '@/components/content/PostCard';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { Section } from '@/components/shared/Section';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Button } from '@/components/ui/Button';
import { withFallback } from '@/lib/api/fallback';
import { getPosts } from '@/lib/api/posts';
import { Link } from '@/lib/i18n/navigation';
import { ROUTES } from '@/lib/routes';

const LATEST_LIMIT = 3;

/** Home section 11: the three newest posts. */
export async function LatestPosts() {
  const [locale, t, posts] = await Promise.all([
    getLocale(),
    getTranslations('home.latestPosts'),
    withFallback(
      'home-latest-posts',
      async () => (await getPosts({ pageSize: LATEST_LIMIT })).data,
      [],
    ),
  ]);
  if (posts.length === 0) return null;

  return (
    <Section surface="light">
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} />
        <Button asChild variant="outline" className="shrink-0">
          <Link href={ROUTES.BLOG}>
            {t('viewAll')}
            <ArrowRight aria-hidden className="rtl-flip" />
          </Link>
        </Button>
      </div>
      <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <StaggerItem key={post.id}>
            <PostCard post={post} locale={locale} />
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
