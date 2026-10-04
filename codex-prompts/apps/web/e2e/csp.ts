import type { Page } from '@playwright/test';

/**
 * Collects every CSP violation the page reports, from the console and from
 * `securitypolicyviolation` events (registered before any page script runs).
 */
export async function watchCspViolations(page: Page): Promise<string[]> {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (/content security policy/i.test(message.text())) violations.push(message.text());
  });
  await page.exposeFunction('reportCspViolation', (detail: string) => {
    violations.push(detail);
  });
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      const report = (window as unknown as { reportCspViolation: (detail: string) => void })
        .reportCspViolation;
      report(`${event.violatedDirective} blocked ${event.blockedURI}`);
    });
  });
  return violations;
}
