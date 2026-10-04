import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@codex/shared';

import { DocumentLink } from '@/components/content/DocumentLink';
import { MediaImage } from '@/components/content/MediaImage';
import { PageCta } from '@/components/content/PageCta';
import { PageHero } from '@/components/content/PageHero';
import { PostCard } from '@/components/content/PostCard';
import { RegisterAlternatePaths } from '@/components/layout/AlternatePaths';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { ShareLinks } from '@/components/sections/blog/ShareLinks';
import { TableOfContents } from '@/components/sections/blog/TableOfContents';
import { JsonLd } from '@/components/seo/JsonLd';
import { Section } from '@/components/shared/Section';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Badge } from '@/components/ui/Badge';
import { withFallback } from '@/lib/api/fallback';
import { getPost, getRelatedPosts } from '@/lib/api/posts';
import { getSiteSettings } from '@/lib/api/settings';
import { listHref } from '@/lib/content/list-params';
import { resolveBySlug } from '@/lib/content/resolve-slug';
import { formatDate } from '@/lib/i18n/format';
import { collectHeadings } from '@/lib/rich-text/headings';
import { RichText } from '@/lib/rich-text/RichText';
import { localizedPaths, postRoute, ROUTES, slugIn } from '@/lib/routes';
import { articleJsonLd } from '@/lib/seo/json-ld';
import { buildMetadata, SITE_NAME } from '@/lib/seo/metadata';
import { absoluteUrl, localizedUrl, ogImageOf } from '@/lib/seo/url';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

const loadPost = (slug: string, locale: Locale) =>
  resolveBySlug({ slug, locale, load: getPost, toPath: postRoute });

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const post = await loadPost(slug, locale);
  return buildMetadata({
    title: post.seo?.metaTitle?.[locale] ?? post.title[locale],
    description: post.seo?.metaDescription?.[locale] ?? post.excerpt[locale],
    path: localizedPaths(post, postRoute),
    locale,
    image: ogImageOf(post.ogImage ?? post.cover, locale),
    type: 'article',
  });
}

/** /blog/[slug]: one article with its table of contents, share links, tags and related posts. */
export default async function PostPage({ params }: PostPageProps) {
  const [{ slug }, locale, t, tContent] = await Promise.all([
    params,
    getLocale(),
    getTranslations('blog'),
    getTranslations('content'),
  ]);
  const post = await loadPost(slug, locale);
  const path = postRoute(slugIn(post, locale));
  const url = localizedUrl(locale, path);
  const [related, settings] = await Promise.all([
    withFallback('post-related', () => getRelatedPosts(slugIn(post, locale), locale), []),
    getSiteSettings(),
  ]);
  const content = post.content[locale];
  const headings = collectHeadings(content);
  const [category] = post.categories;

  return (
    <>
      <RegisterAlternatePaths {...localizedPaths(post, postRoute)} />
      <JsonLd
        data={articleJsonLd({
          headline: post.title[locale],
          description: post.excerpt[locale],
          url,
          image: post.cover?.url,
          datePublished: post.publishedAt ?? post.updatedAt,
          dateModified: post.updatedAt,
          authorName: post.author.name,
          publisherName: settings?.companyName[locale] ?? SITE_NAME,
          publisherLogo: settings?.logo?.url ?? absoluteUrl('/brand/logo.svg'),
          locale,
        })}
      />
      <PageHero
        locale={locale}
        breadcrumbs={[
          { label: t('meta.title'), href: ROUTES.BLOG },
          { label: post.title[locale], href: path },
        ]}
        eyebrow={category?.name[locale]}
        title={post.title[locale]}
        description={post.excerpt[locale]}
        className="pb-40 md:pb-56"
      >
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
          <span>{t('post.by', { author: post.author.name })}</span>
          <span aria-hidden>·</span>
          {post.publishedAt ? (
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
          ) : null}
          <span aria-hidden>·</span>
          <span>{tContent('readingTime', { minutes: post.readingTime[locale] })}</span>
        </p>
      </PageHero>
      <Section surface="white" className="flow-root pt-0 md:pt-0">
        {post.cover ? (
          <div className="relative -mt-32 overflow-hidden rounded-3xl border border-border shadow-lg md:-mt-44">
            <MediaImage
              media={post.cover}
              locale={locale}
              sizes="(min-width: 1280px) 75rem, 100vw"
              isPriority
              className="h-auto w-full"
            />
          </div>
        ) : null}
        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16">
          <aside className="lg:order-last">
            <TableOfContents headings={headings} title={t('post.tableOfContents')} />
          </aside>
          <div className="flex flex-col gap-12">
            <RichText doc={content} locale={locale} />
            {post.tags.length > 0 ? (
              <section aria-labelledby="tags-title" className="flex flex-col gap-3">
                <h2 id="tags-title" className="font-sans text-base font-medium">
                  {t('post.tags')}
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <li key={tag.id}>
                      <DocumentLink href={listHref(ROUTES.BLOG, { tag: slugIn(tag, locale) })}>
                        <Badge variant="outline" className="hover:border-primary">
                          #{tag.name[locale]}
                        </Badge>
                      </DocumentLink>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <ShareLinks url={url} title={post.title[locale]} />
          </div>
        </div>
      </Section>

      {related.length > 0 ? (
        <Section surface="light">
          <SectionHeading eyebrow={t('post.relatedEyebrow')} title={t('post.relatedTitle')} />
          <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
            {related.map((item) => (
              <StaggerItem key={item.id}>
                <PostCard post={item} locale={locale} />
              </StaggerItem>
            ))}
          </Stagger>
        </Section>
      ) : null}
      <PageCta />
    </>
  );
}
