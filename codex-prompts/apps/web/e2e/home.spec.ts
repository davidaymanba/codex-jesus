import { expect, test } from '@playwright/test';

import { watchPageErrors } from './console';

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`home hydrates without errors (${reducedMotion} motion)`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    const errors = watchPageErrors(page);
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
}

test('home has one h1 and Organization + WebSite structured data', async ({ page }) => {
  await page.goto('/ar');
  await expect(page.locator('h1')).toHaveCount(1);
  const types = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
    scripts.flatMap((script) => {
      const data = JSON.parse(script.textContent) as { '@type': string } | { '@type': string }[];
      return (Array.isArray(data) ? data : [data]).map((item) => item['@type']);
    }),
  );
  expect(types).toEqual(expect.arrayContaining(['Organization', 'WebSite']));
});

test('the hero CTAs lead to the quote form and the portfolio', async ({ page }) => {
  await page.goto('/en');
  const hero = page.locator('main > section').first();
  await expect(hero.getByRole('link').first()).toHaveAttribute('href', '/en/quote');
  await expect(hero.getByRole('link').nth(1)).toHaveAttribute('href', '/en/portfolio');
});

test.describe('with the API (seeded)', () => {
  test.skip(Boolean(process.env.CI), 'CI runs the web app without the API');

  test('the clients marquee pauses on hover and stops for reduced motion', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'hover needs a pointer');
    await page.goto('/en');
    const track = page.locator('.animate-marquee');
    const state = () => track.evaluate((element) => getComputedStyle(element).animationPlayState);
    expect(await state()).toBe('running');
    // The track is wider than the screen; hover its visible window.
    await track.locator('..').hover();
    expect(await state()).toBe('paused');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await track.evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
  });

  test('the testimonials slider scrolls with its buttons and can be paused', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/en');
    const carousel = page.getByRole('region', { name: 'Client testimonials' });
    await carousel.scrollIntoViewIfNeeded();
    const viewport = carousel.locator('[tabindex="0"]');
    const scroll = () => viewport.evaluate((element) => element.scrollLeft);

    await carousel.getByRole('button', { name: 'Next testimonial' }).click();
    await expect.poll(scroll).toBeGreaterThan(0);

    const pause = carousel.getByRole('button', { name: 'Pause automatic rotation' });
    await pause.click();
    await expect(carousel.getByRole('button', { name: 'Resume automatic rotation' })).toBeVisible();
  });
});
