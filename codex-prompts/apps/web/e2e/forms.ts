import type { Page, Request } from '@playwright/test';

/** A Turnstile stand-in that solves at once, so form tests never depend on Cloudflare. */
const TURNSTILE_STUB = `
  window.turnstile = {
    render(container, options) { setTimeout(() => options.callback('test-token'), 50); return 'widget-1'; },
    reset() {},
    remove() {},
  };
`;

export async function stubTurnstile(page: Page): Promise<void> {
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: TURNSTILE_STUB }),
  );
}

interface MockAnswer {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
}

/** Answers the form's API calls with `answers` in turn (the last one repeats). */
export async function mockFormApi(
  page: Page,
  path: '/public/contact' | '/public/quote',
  answers: MockAnswer[],
): Promise<Request[]> {
  const requests: Request[] = [];
  await page.route(`**/api/v1${path}`, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': 'http://localhost:3000',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
      return;
    }
    requests.push(request);
    const answer = answers[Math.min(requests.length - 1, answers.length - 1)] ?? { status: 201 };
    await route.fulfill({
      status: answer.status,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Expose-Headers': 'Retry-After',
        ...answer.headers,
      },
      body: JSON.stringify(answer.body ?? { success: true, data: { received: true } }),
    });
  });
  return requests;
}

export const apiError = (code: string, details: { path: string; message: string }[] = []) => ({
  success: false,
  error: { code, message: `errors.${code}`, details, requestId: 'test' },
});
