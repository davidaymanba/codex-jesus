import { expect, test } from '@playwright/test';

test('a too-short search explains itself instead of failing', async ({ page }) => {
  const response = await page.goto('/en/blog?q=a');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('status')).toContainText('Type at least 2 characters');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('junk page numbers are 404s', async ({ request }) => {
  expect((await request.get('/en/blog?page=zero')).status()).toBe(404);
});

test.describe('with the API (seeded)', () => {
  test.skip(Boolean(process.env.CI), 'CI runs the web app without the API');

  test('search runs on the server from a plain form and is not indexed', async ({ page }) => {
    await page.goto('/en/blog');
    await page.getByRole('searchbox', { name: 'Search articles' }).fill('n8n');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page).toHaveURL(/\/en\/blog\?q=n8n$/);
    await expect(page.getByRole('status')).toContainText('1 article matches “n8n”');
    await expect(page.locator('main article')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('category pages are indexable and redirect another locale’s slug', async ({
    page,
    request,
  }) => {
    await page.goto('/en/blog/category/development');
    await expect(page.locator('h1')).toHaveText('Development articles');
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

    const response = await request.get('/ar/blog/category/development', { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toContain(
      `/ar/blog/category/${encodeURIComponent('التطوير')}`,
    );
  });

  test('a post has Article data, a working table of contents and plain share links', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/en/blog/automation-with-n8n-and-ai-agents');
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(jsonLd.join()).toContain('"@type":"Article"');
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');

    if (isMobile) await page.locator('details summary', { hasText: 'On this page' }).click();
    const toc = page.getByRole('navigation', { name: 'On this page' }).filter({ visible: true });
    await toc.getByRole('link', { name: 'Where n8n fits' }).click();
    await expect(page).toHaveURL(/#where-n8n-fits$/);
    await expect(page.locator('h2#where-n8n-fits')).toBeInViewport();

    const share = page.getByRole('link', { name: 'Share on LinkedIn' });
    await expect(share).toHaveAttribute('href', /^https:\/\/www\.linkedin\.com\/sharing\//);
    await expect(share).toHaveAttribute('rel', 'noopener noreferrer');
    expect(await page.locator('script[src*="linkedin"], script[src*="facebook"]').count()).toBe(0);
  });

  test('the RSS feed lists posts with absolute links in the locale', async ({ request }) => {
    const response = await request.get('/ar/blog/rss.xml');
    expect(response.headers()['content-type']).toContain('application/rss+xml');
    const xml = await response.text();
    expect(xml).toContain('<language>ar</language>');
    expect(xml).toMatch(/<item><title>[^<]+<\/title><link>http:\/\/localhost:3000\/ar\/blog\//);
  });
});
