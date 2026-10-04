import { expect, test } from '@playwright/test';

test.describe('locale routing', () => {
  test('sends a first visit to the browser language, then remembers the choice', async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale: 'en-US' });
    const page = await context.newPage();

    await page.goto('/');
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

    await page.goto('/ar');
    await page.goto('/');
    await expect(page).toHaveURL(/\/ar$/);
    await context.close();
  });

  test('sets lang and dir per locale', async ({ page }) => {
    await page.goto('/ar');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await page.goto('/en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('renders a localized 404 for unknown pages', async ({ page }) => {
    const response = await page.goto('/ar/this-page-does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('هذه الصفحة غير موجودة');
  });

  test('declares hreflang alternates only in the HTML, never in a Link header', async ({
    page,
  }) => {
    const response = await page.goto('/en');
    expect(response?.headers().link ?? '').not.toContain('hreflang');
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      'href',
      /\/ar$/,
    );
  });
});

test.describe('header', () => {
  test('offers the skip link first, then the logo, navigation and quote CTA', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/en');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();

    const banner = page.getByRole('banner');
    await expect(banner.getByRole('link', { name: 'Codex home page' })).toBeVisible();
    if (isMobile) {
      await expect(banner.getByRole('button', { name: 'Open menu' })).toBeVisible();
    } else {
      const nav = banner.getByRole('navigation', { name: 'Main navigation' });
      for (const item of ['Home', 'Portfolio', 'Blog', 'About', 'Contact']) {
        await expect(nav.getByRole('link', { name: item })).toBeVisible();
      }
      await expect(nav.getByRole('button', { name: 'Services' })).toBeVisible();
      await expect(banner.getByRole('link', { name: 'Request a Quote' })).toBeVisible();
    }
  });

  test('switches language on the same page and keeps the choice', async ({ page, isMobile }) => {
    await page.goto('/ar/dev/ui');
    if (isMobile) await page.getByRole('button', { name: 'افتح القائمة' }).click();
    await page.getByRole('link', { name: 'تغيير اللغة: English' }).click();

    await expect(page).toHaveURL(/\/en\/dev\/ui$/);
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    const cookies = await page.context().cookies();
    expect(cookies.find(({ name }) => name === 'NEXT_LOCALE')?.value).toBe('en');
  });
});

test.describe('mobile menu', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile layout only');

  test('opens as a dialog, closes with Escape and returns focus', async ({ page }) => {
    await page.goto('/ar');
    const trigger = page.getByRole('button', { name: 'افتح القائمة' });
    await trigger.click();

    const menu = page.getByRole('dialog', { name: 'التنقل الرئيسي' });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('link', { name: 'أعمالنا' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'اطلب عرض سعر' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe('services dropdown', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop layout only');

  test('opens on click, lists services and closes with Escape back to its button', async ({
    page,
  }) => {
    await page.goto('/en');
    const trigger = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', {
      name: 'Services',
    });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('link', { name: 'All services' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('link', { name: 'All services' })).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
