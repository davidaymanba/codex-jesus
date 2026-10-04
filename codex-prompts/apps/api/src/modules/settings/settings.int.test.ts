import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { adminSiteSettingsDtoSchema, siteSettingsDtoSchema } from '@codex/shared';

import { localized } from '@/test/integration/fixtures.js';
import { adminCall, app, dataOf, signInAs } from '@/test/integration/http.js';

describe('site settings', () => {
  const settings = {
    companyName: localized('كودكس', 'Codex'),
    contact: {
      phone: '+966500000000',
      email: 'hello@codex.example',
      address: localized('الرياض', 'Riyadh'),
    },
    socials: [],
    defaultSeo: {
      metaTitle: localized('كودكس', 'Codex'),
      metaDescription: localized('وكالة رقمية', 'A digital agency'),
    },
    homepage: {
      hero: {
        eyebrow: localized('وكالة', 'Agency'),
        title: localized('نبني', 'We build'),
        subtitle: localized('منتجات', 'Products'),
        primaryCta: { label: localized('اطلب', 'Request'), href: '/quote' },
      },
      stats: [],
      processSteps: [],
      featuredProjectIds: [],
      cta: {
        title: localized('ابدأ', 'Start'),
        subtitle: localized('الآن', 'Now'),
        button: { label: localized('تواصل', 'Contact'), href: '/contact' },
      },
    },
  };

  it('is managed by admins only and served publicly', async () => {
    const editor = await signInAs('EDITOR');
    const admin = await signInAs('ADMIN');

    const denied = await adminCall('put', '/admin/settings', editor).send(settings);
    const saved = await adminCall('put', '/admin/settings', admin).send(settings);
    const unknownProject = await adminCall('put', '/admin/settings', admin).send({
      ...settings,
      homepage: {
        ...settings.homepage,
        featuredProjectIds: ['01a0f22c-2844-7730-8ecd-ee01e0578000'],
      },
    });

    expect(denied.status).toBe(403);
    expect(saved.status).toBe(200);
    expect(unknownProject.status).toBe(400);
    const publicSettings = dataOf(
      await request(app).get('/api/v1/public/settings'),
      siteSettingsDtoSchema,
    );
    expect(publicSettings.contact.email).toBe('hello@codex.example');
    // Picked ids may point at drafts: the public DTO never exposes them.
    expect(publicSettings.homepage).not.toHaveProperty('featuredProjectIds');
    expect(dataOf(saved, adminSiteSettingsDtoSchema).homepage.featuredProjectIds).toEqual([]);
  });
});
