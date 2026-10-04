import { expect, test } from '@playwright/test';

import { watchPageErrors } from './console';

test('about tells the story with one h1 and works without the API', async ({ page }) => {
  const errors = watchPageErrors(page);
  await page.goto('/ar/about');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'رسالتنا' })).toBeVisible();
  await expect(page.locator('section#teams')).toBeAttached();
  expect(errors).toEqual([]);
});

test.describe('with the API (seeded)', () => {
  test.skip(Boolean(process.env.CI), 'CI runs the web app without the API');

  test('team members are grouped by team', async ({ page }) => {
    await page.goto('/en/about');
    for (const team of ['Brand Team', 'Marketing Team', 'Development Team']) {
      const group = page.getByRole('region', { name: team });
      await expect(group.locator('article')).toHaveCount(2);
    }
  });
});
