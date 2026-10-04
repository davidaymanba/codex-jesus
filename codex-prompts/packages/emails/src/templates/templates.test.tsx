import { describe, expect, it } from 'vitest';

import {
  renderContactConfirmation,
  renderNewLeadNotification,
  renderPasswordReset,
  renderQuoteConfirmation,
} from '../emails.js';

const XSS = '<script>alert(1)</script><img src=x onerror=alert(1)>';

describe('email templates', () => {
  it('renders the Arabic lead notification right-to-left, with a plain-text version', async () => {
    const email = await renderNewLeadNotification({
      locale: 'ar',
      kind: 'quote',
      name: 'سارة',
      email: 'sara@example.com',
      services: ['ECOMMERCE', 'SEO'],
      budgetRange: 'UNDER_5K',
      timeline: 'ASAP',
      projectDetails: 'متجر إلكتروني',
      adminUrl: 'https://codex.example/admin/quotes/1',
    });

    expect(email.subject).toBe('طلب عرض سعر جديد من سارة');
    expect(email.html).toContain('dir="rtl"');
    expect(email.html).toContain('https://codex.example/admin/quotes/1');
    expect(email.text).toContain('المتاجر الإلكترونية');
    expect(email.text).not.toMatch(/<[a-z]/i);
  });

  it('escapes user input in every template', async () => {
    const emails = await Promise.all([
      renderNewLeadNotification({
        locale: 'en',
        kind: 'contact',
        name: XSS,
        email: 'x@example.com',
        company: XSS,
        message: XSS,
        adminUrl: 'https://codex.example/admin/messages/1',
      }),
      renderQuoteConfirmation({ locale: 'en', name: XSS, services: ['CRM'] }),
      renderContactConfirmation({ locale: 'en', name: XSS }),
    ]);

    for (const { html } of emails) {
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<img src=x');
      expect(html).toContain('&lt;script&gt;');
    }
  });

  it('localizes the client confirmations and the password reset link', async () => {
    const quote = await renderQuoteConfirmation({ locale: 'en', name: 'Omar', services: ['CRM'] });
    const reset = await renderPasswordReset({
      locale: 'ar',
      name: 'Admin',
      resetUrl: 'https://codex.example/admin/reset-password?token=abc',
      expiresInMinutes: 60,
    });

    expect(quote.html).toContain('dir="ltr"');
    expect(quote.text).toContain('CRM systems');
    expect(reset.subject).toBe('إعادة تعيين كلمة المرور');
    expect(reset.html).toContain('token=abc');
    expect(reset.text).toContain('60');
  });
});
