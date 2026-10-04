import { describe, expect, it } from 'vitest';

import { createMediaSchema } from './media.js';
import { createClientSchema, createTeamMemberSchema, createTestimonialSchema } from './showcase.js';
import { VALIDATION_MESSAGES as MSG } from '../constants/validation-messages.js';
import { localized } from '../test/fixtures.js';
import { issuesByPath } from '../test/issues.js';

describe('showcase schemas', () => {
  it('bounds testimonial ratings to 1–5', () => {
    const base = {
      clientName: '[Client Name]',
      role: localized('مدير التسويق', 'Marketing Director'),
      quote: localized('تجربة ممتازة', 'Great experience'),
    };

    expect(createTestimonialSchema.parse({ ...base, rating: 5 })).toMatchObject({
      order: 0,
      isVisible: true,
    });
    expect(issuesByPath(createTestimonialSchema, { ...base, rating: 6 })).toEqual({
      rating: MSG.NUMBER_TOO_BIG,
    });
    expect(issuesByPath(createTestimonialSchema, { ...base, rating: 4.5 })).toEqual({
      rating: MSG.NOT_INTEGER,
    });
  });

  it('allows one social link per platform', () => {
    const member = {
      name: localized('[عضو الفريق]', '[Team Member]'),
      role: localized('مصممة', 'Designer'),
      team: 'BRAND',
      bio: localized('نبذة', 'Bio'),
    };
    const link = { platform: 'LINKEDIN', url: 'https://linkedin.com/in/example' };

    expect(createTeamMemberSchema.parse(member).socials).toEqual([]);
    expect(issuesByPath(createTeamMemberSchema, { ...member, socials: [link, link] })).toEqual({
      socials: MSG.DUPLICATE_ITEMS,
    });
  });

  it('rejects non-http client websites', () => {
    expect(
      issuesByPath(createClientSchema, { name: '[Client Name]', website: 'javascript:alert(1)' }),
    ).toEqual({ website: MSG.INVALID_URL });
  });

  it('only accepts allow-listed image types (no SVG)', () => {
    const media = {
      url: 'https://res.cloudinary.com/demo/x.svg',
      publicId: 'x',
      alt: localized('شعار', 'Logo'),
      width: 10,
      height: 10,
      sizeBytes: 100,
      mimeType: 'image/svg+xml',
    };

    expect(issuesByPath(createMediaSchema, media)).toEqual({ mimeType: MSG.INVALID_OPTION });
  });
});
