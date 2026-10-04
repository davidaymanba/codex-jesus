import type { Page } from '@playwright/test';

/** Collects uncaught errors and console errors (hydration mismatches, CSP reports…). */
export function watchPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}
