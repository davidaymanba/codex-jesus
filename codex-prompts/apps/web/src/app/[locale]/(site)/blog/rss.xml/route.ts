import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import type { Locale, PostSummaryDto } from '@codex/shared';

import { getPosts } from '@/lib/api/posts';
import { routing } from '@/lib/i18n/routing';
import { blogRssRoute, postRoute, ROUTES, slugIn } from '@/lib/routes';
import { localizedUrl } from '@/lib/seo/url';

const FEED_SIZE = 20;

const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

/** Text for XML content and attributes. */
export const escapeXml = (text: string): string =>
  text.replace(/[&<>"']/g, (character) => XML_ESCAPES[character] ?? character);

function itemXml(post: PostSummaryDto, locale: Locale): string {
  const link = localizedUrl(locale, postRoute(slugIn(post, locale)));
  return [
    '<item>',
    `<title>${escapeXml(post.title[locale])}</title>`,
    `<link>${escapeXml(link)}</link>`,
    `<guid isPermaLink="true">${escapeXml(link)}</guid>`,
    post.publishedAt ? `<pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>` : '',
    `<description>${escapeXml(post.excerpt[locale])}</description>`,
    ...post.categories.map(({ name }) => `<category>${escapeXml(name[locale])}</category>`),
    '</item>',
  ].join('');
}

/** /[locale]/blog/rss.xml: the latest posts of one locale as RSS 2.0. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
): Promise<Response> {
  await connection();
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const [t, { data: posts }] = await Promise.all([
    getTranslations({ locale, namespace: 'blog.meta' }),
    getPosts({ pageSize: FEED_SIZE }),
  ]);

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>',
    `<title>${escapeXml(t('feedTitle'))}</title>`,
    `<link>${escapeXml(localizedUrl(locale, ROUTES.BLOG))}</link>`,
    `<description>${escapeXml(t('feedDescription'))}</description>`,
    `<language>${locale}</language>`,
    `<atom:link href="${escapeXml(localizedUrl(locale, blogRssRoute))}" rel="self" type="application/rss+xml"/>`,
    ...posts.map((post) => itemXml(post, locale)),
    '</channel></rss>',
  ].join('\n');

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
