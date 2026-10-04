import { expect, test, type Page } from '@playwright/test';

import { watchCspViolations } from './csp';
import { apiError, mockFormApi, stubTurnstile } from './forms';

test.beforeEach(async ({ page }) => {
  await stubTurnstile(page);
});

async function fillValid(page: Page) {
  await page.locator('#contact-name').fill('Sara Ahmed');
  await page.locator('#contact-email').fill('sara@example.com');
  await page.locator('#contact-message').fill('We need a Salla store with a custom theme.');
}

const submitButton = (page: Page) => page.locator('form button[type="submit"]');

test('shows localized validation errors without calling the API', async ({ page }) => {
  const requests = await mockFormApi(page, '/public/contact', [{ status: 201 }]);
  await page.goto('/ar/contact');
  await expect(submitButton(page)).toBeEnabled();
  await page.locator('#contact-email').fill('not-an-email');
  await submitButton(page).click();

  await expect(page.locator('#contact-email-error')).toHaveText('أدخل بريدًا إلكترونيًا صحيحًا');
  await expect(page.locator('#contact-name')).toBeFocused();
  await expect(page.locator('#contact-name')).toHaveAttribute('aria-invalid', 'true');
  expect(requests).toHaveLength(0);
});

test('sends once, with the locale and the Turnstile token, then confirms', async ({ page }) => {
  const requests = await mockFormApi(page, '/public/contact', [{ status: 201 }]);
  await page.goto('/en/contact');
  await fillValid(page);
  await submitButton(page).dblclick();

  const success = page.getByRole('heading', { name: 'Thank you, your message is on its way' });
  await expect(success).toBeFocused();
  expect(requests).toHaveLength(1);
  expect(requests[0]?.postDataJSON()).toEqual({
    name: 'Sara Ahmed',
    email: 'sara@example.com',
    message: 'We need a Salla store with a custom theme.',
    locale: 'en',
    turnstileToken: 'test-token',
  });
});

test('explains a rate limit with the wait from Retry-After', async ({ page }) => {
  await mockFormApi(page, '/public/contact', [
    { status: 429, body: apiError('RATE_LIMITED'), headers: { 'Retry-After': '120' } },
  ]);
  await page.goto('/en/contact');
  await fillValid(page);
  await submitButton(page).click();
  await expect(page.locator('form').getByRole('alert').last()).toContainText(
    'Please try again in 2 minutes',
  );
});

test('shows the API’s field errors next to the fields', async ({ page }) => {
  await mockFormApi(page, '/public/contact', [
    {
      status: 400,
      body: apiError('VALIDATION_FAILED', [{ path: 'email', message: 'validation.email.invalid' }]),
    },
  ]);
  await page.goto('/en/contact');
  await fillValid(page);
  await submitButton(page).click();
  await expect(page.locator('#contact-email-error')).toHaveText('Enter a valid email address');
});

test('offers a retry after a failure, and the retry succeeds', async ({ page }) => {
  const requests = await mockFormApi(page, '/public/contact', [
    { status: 503, body: apiError('SERVICE_UNAVAILABLE') },
    { status: 201 },
  ]);
  await page.goto('/en/contact');
  await fillValid(page);
  await submitButton(page).click();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: /your message is on its way/ })).toBeVisible();
  expect(requests).toHaveLength(2);
});

test('the form page stays within the CSP, zod included', async ({ page }) => {
  const violations = await watchCspViolations(page);
  await mockFormApi(page, '/public/contact', [{ status: 201 }]);
  await page.goto('/en/contact');
  await fillValid(page);
  await submitButton(page).click();
  await expect(page.getByRole('heading', { name: /your message is on its way/ })).toBeVisible();
  expect(violations).toEqual([]);
});

test('zod is downloaded only when the visitor starts on the form', async ({ page }) => {
  const scripts: string[] = [];
  page.on('response', async (response) => {
    if (response.request().resourceType() === 'script' && response.url().includes('/_next/')) {
      scripts.push(await response.text());
    }
  });
  const hasZod = () => scripts.some((code) => code.includes('$ZodType'));

  await page.goto('/en');
  await page.waitForLoadState('networkidle');
  expect(hasZod()).toBe(false);

  await page.goto('/en/contact');
  await page.waitForLoadState('load');
  expect(hasZod()).toBe(false);
  await page.locator('#contact-name').focus();
  await expect.poll(hasZod).toBe(true);
});

test('the map loads only on request', async ({ page }) => {
  test.skip(Boolean(process.env.CI), 'the address comes from the API settings');
  await page.goto('/en/contact');
  await expect(page.locator('iframe[src*="google.com/maps"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Show the map' }).click();
  await expect(page.locator('iframe[src*="google.com/maps"]')).toHaveAttribute(
    'title',
    'Map of the Codex office',
  );
});
