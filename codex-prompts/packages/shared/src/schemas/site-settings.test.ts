import { describe, expect, it } from 'vitest';

import { siteSettingsSchema, updateSiteSettingsSchema } from './site-settings.js';
import { VALIDATION_MESSAGES as MSG } from '../constants/validation-messages.js';
import { ID, localized } from '../test/fixtures.js';
import { issuesByPath } from '../test/issues.js';

const cta = { label: localized('اطلب عرض سعر', 'Get a quote'), href: '/quote' };

const settings = {
  companyName: localized('كودكس', 'Codex'),
  contact: {
    phone: '+966500000000',
    email: 'hello@example.com',
    address: localized('[عنوان الشركة]', '[Company address]'),
  },
  socials: [],
  defaultSeo: {
    metaTitle: localized('كودكس', 'Codex'),
    metaDescription: localized('وكالة رقمية', 'Digital agency'),
  },
  homepage: {
    hero: {
      eyebrow: localized('وكالة رقمية', 'Digital agency'),
      title: localized('نبني', 'We build'),
      subtitle: localized('نص', 'Text'),
      primaryCta: cta,
    },
    stats: [{ value: 50, suffix: '+', label: localized('مشروع', 'Projects') }],
    processSteps: [],
    featuredProjectIds: [ID],
    cta: {
      title: localized('لنبدأ', "Let's start"),
      subtitle: localized('نص', 'Text'),
      button: cta,
    },
  },
};

describe('siteSettingsSchema', () => {
  it('accepts complete settings', () => {
    expect(siteSettingsSchema.safeParse(settings).success).toBe(true);
  });

  it('requires default SEO title and description', () => {
    expect(issuesByPath(siteSettingsSchema, { ...settings, defaultSeo: {} })).toEqual({
      'defaultSeo.metaTitle': MSG.REQUIRED,
      'defaultSeo.metaDescription': MSG.REQUIRED,
    });
  });

  it('only allows site-relative CTA targets', () => {
    const homepage = {
      ...settings.homepage,
      hero: { ...settings.homepage.hero, primaryCta: { ...cta, href: 'https://evil.example' } },
    };

    expect(issuesByPath(siteSettingsSchema, { ...settings, homepage })).toEqual({
      'homepage.hero.primaryCta.href': MSG.INVALID_PATH,
    });
  });

  it('supports partial updates', () => {
    expect(updateSiteSettingsSchema.parse({ socials: [] })).toEqual({ socials: [] });
  });
});
