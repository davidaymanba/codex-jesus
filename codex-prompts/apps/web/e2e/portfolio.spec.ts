import { expect, test } from '@playwright/test';

test('junk listing URLs are 404s instead of duplicate pages', async ({ request }) => {
  for (const query of ['?page=0', '?page=abc', '?page=1.5', '?category=no-such-category']) {
    expect([query, (await request.get(`/en/portfolio${query}`)).status()]).toEqual([query, 404]);
  }
});

test.describe('with the API (seeded)', () => {
  test.skip(Boolean(process.env.CI), 'CI runs the web app without the API');

  test('category filters are crawlable links that narrow the grid', async ({ page }) => {
    await page.goto('/en/portfolio');
    const filters = page.getByRole('navigation', { name: 'Filter projects by category' });
    await expect(filters.getByRole('link', { name: 'All projects' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    const allCount = await page.locator('main article').count();

    await filters.getByRole('link', { name: 'Brand identity' }).click();
    await expect(page).toHaveURL(/\/en\/portfolio\?category=brand-identity$/);
    // Filters are full navigations: a soft one would keep the previous page's <head>.
    await expect(page).toHaveTitle(/^Brand identity projects/);
    await expect(filters.getByRole('link', { name: 'Brand identity' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    const filteredCount = await page.locator('main article').count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(allCount);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/en\/portfolio\?category=brand-identity$/,
    );
  });

  test('a category slug of the other locale redirects to this locale’s slug', async ({
    request,
  }) => {
    const response = await request.get('/ar/portfolio?category=e-commerce', { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toContain(
      `/ar/portfolio?category=${encodeURIComponent('التجارة-الإلكترونية')}`,
    );
  });

  test('a case study has CreativeWork data, its cover as the LCP image, and neighbours', async ({
    page,
  }) => {
    await page.goto('/en/portfolio/salla-fashion-store');
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(jsonLd.join()).toContain('"@type":"CreativeWork"');
    await expect(page.locator('main img').first()).toHaveAttribute('fetchpriority', 'high');
    await expect(page.getByRole('link', { name: /Next project/ })).toBeVisible();
  });

  test('the gallery lightbox opens, moves with the arrow keys and returns focus', async ({
    page,
  }) => {
    await page.goto('/en/portfolio/salla-fashion-store');
    const thumbnail = page.getByRole('button', { name: /Open image 1 of 2/ });
    await thumbnail.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading')).toHaveText('Image 1 of 2');
    await page.keyboard.press('ArrowRight');
    await expect(dialog.getByRole('heading')).toHaveText('Image 2 of 2');
    await page.keyboard.press('ArrowRight');
    await expect(dialog.getByRole('heading')).toHaveText('Image 1 of 2');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(thumbnail).toBeFocused();
  });
});
