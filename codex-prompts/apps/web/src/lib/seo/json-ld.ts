import type { Locale } from '@codex/shared';

/**
 * schema.org builders for the JSON-LD the pages embed. Each returns a plain object;
 * `<JsonLd>` serializes it safely. URLs must be absolute.
 */

type JsonLdObject = Record<string, unknown> & { '@type': string };

const CONTEXT = 'https://schema.org';

export function organizationJsonLd(input: {
  name: string;
  url: string;
  logo: string;
  email?: string;
  phone?: string;
  sameAs?: string[];
}): JsonLdObject {
  return {
    '@context': CONTEXT,
    '@type': 'Organization',
    name: input.name,
    url: input.url,
    logo: input.logo,
    ...(input.email && { email: input.email }),
    ...(input.phone && { telephone: input.phone }),
    ...(input.sameAs && input.sameAs.length > 0 && { sameAs: input.sameAs }),
  };
}

export function webSiteJsonLd(input: { name: string; url: string; locale: Locale }): JsonLdObject {
  return {
    '@context': CONTEXT,
    '@type': 'WebSite',
    name: input.name,
    url: input.url,
    inLanguage: input.locale,
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): JsonLdObject {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function articleJsonLd(input: {
  headline: string;
  description: string;
  url: string;
  image?: string | undefined;
  datePublished: string;
  dateModified: string;
  authorName: string;
  publisherName: string;
  publisherLogo: string;
  locale: Locale;
}): JsonLdObject {
  return {
    '@context': CONTEXT,
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    mainEntityOfPage: input.url,
    ...(input.image && { image: [input.image] }),
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    inLanguage: input.locale,
    author: { '@type': 'Person', name: input.authorName },
    publisher: {
      '@type': 'Organization',
      name: input.publisherName,
      logo: { '@type': 'ImageObject', url: input.publisherLogo },
    },
  };
}

export function serviceJsonLd(input: {
  name: string;
  description: string;
  url: string;
  providerName: string;
  providerUrl: string;
}): JsonLdObject {
  return {
    '@context': CONTEXT,
    '@type': 'Service',
    name: input.name,
    description: input.description,
    url: input.url,
    provider: { '@type': 'Organization', name: input.providerName, url: input.providerUrl },
  };
}

export function creativeWorkJsonLd(input: {
  name: string;
  description: string;
  url: string;
  image?: string | undefined;
  datePublished?: string | undefined;
  dateModified: string;
  creatorName: string;
  creatorUrl: string;
  keywords: string[];
  locale: Locale;
}): JsonLdObject {
  return {
    '@context': CONTEXT,
    '@type': 'CreativeWork',
    name: input.name,
    description: input.description,
    url: input.url,
    ...(input.image && { image: [input.image] }),
    ...(input.datePublished && { datePublished: input.datePublished }),
    dateModified: input.dateModified,
    inLanguage: input.locale,
    creator: { '@type': 'Organization', name: input.creatorName, url: input.creatorUrl },
    ...(input.keywords.length > 0 && { keywords: input.keywords.join(', ') }),
  };
}

export function faqPageJsonLd(items: { question: string; answer: string }[]): JsonLdObject {
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: items.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}

/**
 * JSON for a `<script>` element: `<`, `>` and `&` are escaped so content can never close the
 * script tag or open a comment, whatever the CMS text contains.
 */
export function serializeJsonLd(data: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
