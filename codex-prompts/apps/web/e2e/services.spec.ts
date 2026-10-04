import { expect, test } from '@playwright/test';

import { watchPageErrors } from './console';

const ARABIC_SLUG = 'تطوير-البرمجيات';
const encoded = (slug: string) => encodeURIComponent(slug);

test('/services shows each pillar at a stable anchor, without the API too', async ({ page }) => {
  const errors = watchPageErrors(page);
  await page.goto('/en/services');
  await expect(page.locator('h1')).toHaveCount(1);
  for (const anchor of ['development', 'branding', 'marketing']) {
    await expect(page.locator(`section#${anchor} h2`)).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('the breadcrumbs mark the current page and ship BreadcrumbList data', async ({ page }) => {
  await page.goto('/ar/services');
  const trail = page.getByRole('navigation', { name: 'مسار التنقل' });
  await expect(trail.locator('[aria-current="page"]')).toHaveText('الخدمات');
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(jsonLd.filter((data) => data.includes('"@type":"BreadcrumbList"'))).toHaveLength(1);
});

test.describe('with the API (seeded)', () => {
  test.skip(Boolean(process.env.CI), 'CI runs the web app without the API');

  test('a service page has its JSON-LD, FAQ answers in the HTML and a preselected quote CTA', async ({
    page,
  }) => {
    await page.goto('/en/services/software-development');
    await expect(page.locator('h1')).toHaveText('Software Development');
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(jsonLd.join()).toContain('"@type":"Service"');
    expect(jsonLd.join()).toContain('"@type":"FAQPage"');

    const firstQuestion = page.locator('details').first();
    await expect(firstQuestion.locator('p')).toBeAttached();
    await firstQuestion.locator('summary').click();
    await expect(firstQuestion.locator('p')).toBeVisible();

    await expect(page.getByRole('link', { name: /Request a quote for/ })).toHaveAttribute(
      'href',
      '/en/quote?service=DEVELOPMENT',
    );
  });

  test('a slug from the other locale redirects permanently to this locale’s slug', async ({
    request,
  }) => {
    const toArabic = await request.get('/ar/services/software-development', { maxRedirects: 0 });
    expect(toArabic.status()).toBe(308);
    expect(toArabic.headers().location).toContain(`/ar/services/${encoded(ARABIC_SLUG)}`);

    const toEnglish = await request.get(`/en/services/${encoded(ARABIC_SLUG)}`, {
      maxRedirects: 0,
    });
    expect(toEnglish.status()).toBe(308);
    expect(toEnglish.headers().location).toContain('/en/services/software-development');

    expect((await request.get('/en/services/no-such-service')).status()).toBe(404);
  });

  test('the language switcher links to the other locale’s slug', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the switcher sits in the mobile menu');
    await page.goto('/en/services/software-development');
    await expect(page.getByRole('link', { name: /Change language/ })).toHaveAttribute(
      'href',
      `/ar/services/${ARABIC_SLUG}`,
    );
  });
});

test.describe('without the API', () => {
  test.skip(!process.env.CI, 'locally the API is usually running');

  test('the footer links each pillar to its anchor on /services', async ({ page }) => {
    await page.goto('/en');
    const footer = page.getByRole('contentinfo');
    await expect(footer.getByRole('link', { name: 'Branding' })).toHaveAttribute(
      'href',
      '/en/services#branding',
    );
  });
});
