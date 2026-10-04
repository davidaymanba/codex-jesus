import { describe, expect, it } from 'vitest';

import {
  contactFormSchema,
  quoteFormSchema,
  quoteRequestQuerySchema,
  quoteStep1Schema,
  quoteStep2Schema,
  quoteStep3Schema,
  updateQuoteRequestSchema,
} from './leads.js';
import { VALIDATION_MESSAGES as MSG } from '../constants/validation-messages.js';
import { issuesByPath } from '../test/issues.js';

const step1 = { services: ['SALLA', 'SEO'] };
const step2 = {
  projectDetails: 'نحتاج متجر سلة متكامل مع ربط بالشحن والدفع.',
  budgetRange: 'FROM_5K_TO_15K',
  timeline: 'ONE_TO_THREE_MONTHS',
};
const step3 = { name: 'سارة', email: 'Sara@Example.com', phone: '', company: '' };

describe('quote form', () => {
  it('validates each step on its own', () => {
    expect(quoteStep1Schema.parse(step1)).toEqual(step1);
    expect(quoteStep2Schema.parse(step2)).toEqual(step2);
    expect(quoteStep3Schema.parse(step3)).toEqual({ name: 'سارة', email: 'sara@example.com' });
  });

  it('merges the steps into the full submission', () => {
    const merged = quoteFormSchema.parse({ ...step1, ...step2, ...step3, locale: 'ar' });

    expect(merged).toEqual({
      ...quoteStep1Schema.parse(step1),
      ...quoteStep2Schema.parse(step2),
      ...quoteStep3Schema.parse(step3),
      locale: 'ar',
    });
  });

  it('rejects empty or duplicate service selections', () => {
    expect(issuesByPath(quoteStep1Schema, { services: [] })).toEqual({
      services: MSG.TOO_FEW_ITEMS,
    });
    expect(issuesByPath(quoteStep1Schema, { services: ['SEO', 'SEO'] })).toEqual({
      services: MSG.DUPLICATE_ITEMS,
    });
    expect(issuesByPath(quoteStep1Schema, { services: ['HACKING'] })).toEqual({
      'services.0': MSG.INVALID_OPTION,
    });
  });

  it('enforces the project details length', () => {
    expect(issuesByPath(quoteStep2Schema, { ...step2, projectDetails: 'قصير' })).toEqual({
      projectDetails: MSG.TOO_SHORT,
    });
  });

  it('requires a supported locale', () => {
    expect(issuesByPath(quoteFormSchema, { ...step1, ...step2, ...step3, locale: 'fr' })).toEqual({
      locale: MSG.INVALID_OPTION,
    });
  });

  it('lets admins update pipeline fields only', () => {
    expect(
      updateQuoteRequestSchema.parse({ status: 'WON', internalNotes: null, email: 'x@y.z' }),
    ).toEqual({ status: 'WON', internalNotes: null });
  });

  it('validates the lead date range', () => {
    expect(
      issuesByPath(quoteRequestQuerySchema, {
        from: '2026-06-01T00:00:00Z',
        to: '2026-01-01T00:00:00Z',
      }),
    ).toEqual({ to: MSG.INVALID_DATE_RANGE });
  });
});

describe('contactFormSchema', () => {
  const valid = {
    name: 'Omar',
    email: 'omar@example.com',
    message: 'I would like to discuss a new website.',
    locale: 'en',
  };

  it('accepts a minimal valid message', () => {
    expect(contactFormSchema.parse(valid)).toEqual(valid);
  });

  it.each([
    [{ name: 'O' }, { name: MSG.TOO_SHORT }],
    [{ name: 'O'.repeat(81) }, { name: MSG.TOO_LONG }],
    [{ message: 'Too short' }, { message: MSG.TOO_SHORT }],
    [{ message: 'x'.repeat(2001) }, { message: MSG.TOO_LONG }],
    [{ email: 'nope' }, { email: MSG.INVALID_EMAIL }],
    [{ phone: '12345' }, { phone: MSG.INVALID_PHONE }],
  ])('rejects %o', (override, expected) => {
    expect(issuesByPath(contactFormSchema, { ...valid, ...override })).toEqual(expected);
  });

  it('normalizes an optional phone number', () => {
    expect(contactFormSchema.parse({ ...valid, phone: '+966 50 123 4567' }).phone).toBe(
      '+966501234567',
    );
  });
});
