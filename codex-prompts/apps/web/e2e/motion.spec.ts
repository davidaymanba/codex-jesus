import { expect, test } from '@playwright/test';

const opacityOf = (element: Element) => getComputedStyle(element).opacity;

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('reveals content on scroll (the effect is CSS only)', async ({ page }) => {
    await page.goto('/en/dev/ui');
    const revealed = page.locator('[data-reveal]').last();
    await revealed.evaluate((element) => {
      element.scrollIntoView({ block: 'center' });
    });
    await expect.poll(() => revealed.evaluate(opacityOf)).toBe('1');
  });
});

test('every reveal on the home page completes once scrolled into view', async ({ page }) => {
  // Guards against a reveal inside an `overflow: hidden` ancestor: its timeline never moves.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/en');
  const reveals = page.locator('[data-reveal]');
  const count = await reveals.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    const reveal = reveals.nth(index);
    // Centered: an element just past the bottom edge is still mid-reveal, by design.
    await reveal.evaluate((element) => {
      element.scrollIntoView({ block: 'center' });
    });
    await expect.poll(() => reveal.evaluate(opacityOf)).toBe('1');
  }
});

test('with reduced motion, content below the fold is fully visible without scrolling', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/dev/ui');
  const opacities = await page
    .locator('[data-reveal]')
    .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).opacity));
  expect(opacities.length).toBeGreaterThan(0);
  expect(new Set(opacities)).toEqual(new Set(['1']));
});

test('a counter already on screen at load keeps its value instead of restarting from 0', async ({
  page,
}) => {
  // Tall enough for the showcase's stat to be visible without scrolling.
  await page.setViewportSize({ width: 1280, height: 9000 });
  await page.goto('/en/dev/ui');
  const counter = page
    .getByRole('region', { name: 'Dark surface' })
    .locator('p.font-display > span')
    .first();
  await expect(counter).toHaveText('120+');

  const samples: (string | null)[] = [];
  for (let sample = 0; sample < 10; sample += 1) {
    samples.push(await counter.textContent());
    await page.waitForTimeout(100);
  }
  expect(new Set(samples)).toEqual(new Set(['120+']));
});
