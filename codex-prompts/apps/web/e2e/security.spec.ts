import { expect, test } from '@playwright/test';

import { watchCspViolations } from './csp';

for (const locale of ['ar', 'en'] as const) {
  for (const path of ['', '/dev/ui']) {
    test(`/${locale}${path} runs under the nonce CSP without violations`, async ({ page }) => {
      const violations = await watchCspViolations(page);

      const response = await page.goto(`/${locale}${path}`);
      await page.waitForLoadState('networkidle');

      const csp = response?.headers()['content-security-policy'] ?? '';
      expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
      expect(csp).toContain("frame-ancestors 'none'");
      expect(response?.headers()['x-content-type-options']).toBe('nosniff');
      expect(violations).toEqual([]);
    });
  }
}

test('uses a fresh nonce for every response', async ({ request }) => {
  const nonceOf = async () =>
    /'nonce-([^']+)'/.exec(
      (await request.get('/en')).headers()['content-security-policy'] ?? '',
    )?.[1];
  expect(await nonceOf()).not.toBe(await nonceOf());
});

test('the revalidation webhook rejects unsigned requests', async ({ request }) => {
  const response = await request.post('/api/revalidate', { data: { tags: ['posts'] } });
  expect(response.status()).toBe(401);
});

test('interactive components (dialog, sheet, toast, select) stay within the CSP', async ({
  page,
}) => {
  const violations = await watchCspViolations(page);
  await page.goto('/en/dev/ui');
  const dark = page.getByRole('region', { name: 'Dark surface' });

  await dark.getByRole('button', { name: 'Open dialog' }).click();
  await expect(page.getByRole('dialog', { name: 'Start a project' })).toBeVisible();
  await page.keyboard.press('Escape');

  await dark.getByRole('button', { name: 'Open sheet' }).click();
  await expect(page.getByRole('dialog', { name: 'Start a project' })).toBeVisible();
  await page.keyboard.press('Escape');

  await dark.getByRole('button', { name: 'Show toast' }).click();
  await expect(page.getByText('Your message was sent.')).toBeVisible();

  await dark.getByRole('combobox', { name: 'Budget' }).click();
  await page.getByRole('option', { name: 'Not sure yet' }).click();
  await expect(dark.getByRole('combobox', { name: 'Budget' })).toHaveText('Not sure yet');

  expect(violations).toEqual([]);
});

test('pages with a dot in their path still get the CSP; root files and assets skip the proxy', async ({
  request,
}) => {
  const dotted = await request.get('/en/blog/rss.xml');
  expect(dotted.headers()['content-security-policy']).toContain("'strict-dynamic'");

  for (const asset of [
    '/robots.txt',
    '/brand/logo.svg',
    '/icon.svg',
    '/fonts/inter-latin-300.v1.woff2',
  ]) {
    const response = await request.get(asset, { maxRedirects: 0 });
    expect([asset, response.status()]).toEqual([asset, 200]);
  }
});
