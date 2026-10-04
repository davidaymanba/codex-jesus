import { describe, expect, it } from 'vitest';

import { breadcrumbJsonLd, faqPageJsonLd, serializeJsonLd } from './json-ld';
import { buildMetadata } from './metadata';

describe('buildMetadata', () => {
  it('sets the canonical, hreflang alternates with x-default Arabic, and social cards', () => {
    const metadata = buildMetadata({
      title: 'Services',
      description: 'What we do',
      path: '/services',
      locale: 'en',
    });

    expect(metadata.alternates).toEqual({
      canonical: '/en/services',
      languages: { ar: '/ar/services', en: '/en/services', 'x-default': '/ar/services' },
    });
    expect(metadata.openGraph).toMatchObject({
      url: '/en/services',
      locale: 'en_US',
      alternateLocale: ['ar_AR'],
    });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image', title: 'Services' });
  });

  it('uses each locale’s own path for localized slugs, and / for the home page', () => {
    const service = buildMetadata({
      title: 'Branding',
      description: 'd',
      path: { ar: '/services/الهوية', en: '/services/branding' },
      locale: 'ar',
    });
    const home = buildMetadata({ title: 'Codex', description: 'd', path: '/', locale: 'ar' });

    expect(service.alternates?.canonical).toBe('/ar/services/الهوية');
    expect(service.alternates?.languages).toMatchObject({ en: '/en/services/branding' });
    expect(home.alternates?.canonical).toBe('/ar');
  });
});

describe('buildMetadata images', () => {
  it('falls back to the locale’s generated share image', () => {
    const metadata = buildMetadata({
      title: 'Blog',
      description: 'd',
      path: '/blog',
      locale: 'en',
    });
    expect(metadata.openGraph?.images).toEqual([
      { url: '/en/opengraph-image', width: 1200, height: 630, alt: 'Codex' },
    ]);
    expect(metadata.twitter?.images).toEqual(['/en/opengraph-image']);
  });
});

describe('JSON-LD', () => {
  it('numbers breadcrumb positions from 1', () => {
    const breadcrumbs = breadcrumbJsonLd([
      { name: 'Home', url: 'https://codex.test/en' },
      { name: 'Blog', url: 'https://codex.test/en/blog' },
    ]);
    expect(breadcrumbs.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://codex.test/en' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://codex.test/en/blog' },
    ]);
  });

  it('can never close its script tag, whatever the content says', () => {
    const json = serializeJsonLd(
      faqPageJsonLd([{ question: '</script><script>alert(1)</script>', answer: 'a & b <!--' }]),
    );
    expect(json).not.toMatch(/[<>&]/);
    expect(JSON.parse(json)).toMatchObject({
      mainEntity: [{ name: '</script><script>alert(1)</script>' }],
    });
  });
});
