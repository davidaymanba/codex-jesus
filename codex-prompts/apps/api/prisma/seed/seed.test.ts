import { describe, expect, it } from 'vitest';

import {
  createClientSchema,
  createMediaSchema,
  createPostSchema,
  createProjectSchema,
  createServiceSchema,
  createTeamMemberSchema,
  createTestimonialSchema,
  idSchema,
  siteSettingsSchema,
} from '@codex/shared';

import { seedId } from './builders.js';
import { MEDIA } from './data/media.js';
import { POSTS } from './data/posts.js';
import { PROJECTS } from './data/projects.js';
import { SERVICES } from './data/services/index.js';
import { CLIENTS, TEAM_MEMBERS, TESTIMONIALS } from './data/showcase.js';
import { SITE_SETTINGS } from './data/site-settings.js';
import { CATEGORIES, TAGS } from './data/taxonomy.js';
import { parseSeedEnv, SeedEnvError } from './env.js';

describe('seedId', () => {
  it('is a valid, deterministic UUID', () => {
    expect(idSchema.safeParse(seedId('service:development')).success).toBe(true);
    expect(seedId('a')).toBe(seedId('a'));
    expect(seedId('a')).not.toBe(seedId('b'));
  });
});

describe('seed env', () => {
  const valid = { ADMIN_EMAIL: 'owner@codex.example', ADMIN_PASSWORD: 'Tide-Lantern-47' };

  it('accepts strong credentials and defaults the name', () => {
    expect(parseSeedEnv(valid)).toEqual({ ...valid, ADMIN_NAME: 'Codex Admin' });
  });

  it.each([['short1A-'], ['passwordpassword'], ['Password-2026!'], ['Owner-Strong-99']])(
    'refuses the weak password %s',
    (password) => {
      expect(() => parseSeedEnv({ ...valid, ADMIN_PASSWORD: password })).toThrow(SeedEnvError);
    },
  );

  it('refuses a missing password', () => {
    expect(() => parseSeedEnv({ ADMIN_EMAIL: valid.ADMIN_EMAIL })).toThrow(/ADMIN_PASSWORD/);
  });
});

describe('seed data', () => {
  const cases: [string, { safeParse: (value: unknown) => { success: boolean } }, object[]][] = [
    ['media', createMediaSchema, MEDIA],
    ['services', createServiceSchema, SERVICES],
    ['projects', createProjectSchema, PROJECTS],
    ['posts', createPostSchema, POSTS],
    ['testimonials', createTestimonialSchema, TESTIMONIALS],
    ['team members', createTeamMemberSchema, TEAM_MEMBERS],
    ['clients', createClientSchema, CLIENTS],
  ];

  it.each(cases)('every %s record passes its shared schema', (_name, schema, records) => {
    for (const record of records) expect(schema.safeParse(record).success).toBe(true);
  });

  it('site settings pass their schema', () => {
    expect(siteSettingsSchema.safeParse(SITE_SETTINGS).success).toBe(true);
  });

  it('matches the Phase 1 content counts', () => {
    expect({
      services: SERVICES.length,
      projects: PROJECTS.length,
      posts: POSTS.length,
      testimonials: TESTIMONIALS.length,
      teamMembers: TEAM_MEMBERS.length,
      clients: CLIENTS.length,
    }).toEqual({ services: 3, projects: 6, posts: 3, testimonials: 4, teamMembers: 6, clients: 8 });
  });

  it('includes all nine development sub-services', () => {
    const development = SERVICES.find((service) => service.category === 'DEVELOPMENT');

    expect(development?.subServices.map((item) => item.title.en)).toEqual([
      'E-commerce',
      'E-learning platforms',
      'ERP systems',
      'CRM systems',
      'Salla stores',
      'Shopify stores',
      'WordPress',
      'AI agents',
      'n8n automation',
    ]);
  });

  it('has two team members per team', () => {
    const countFor = (team: string) => TEAM_MEMBERS.filter((member) => member.team === team).length;

    expect(['BRAND', 'MARKETING', 'DEVELOPMENT'].map(countFor)).toEqual([2, 2, 2]);
  });

  it('never reuses a slug', () => {
    for (const records of [SERVICES, PROJECTS, POSTS, CATEGORIES, TAGS]) {
      for (const key of ['slugAr', 'slugEn'] as const) {
        const slugs = records.map((record) => record[key]);
        expect(new Set(slugs).size).toBe(slugs.length);
      }
    }
  });

  it('only references media and projects that the seed creates', () => {
    const mediaIds = new Set(MEDIA.map((media) => media.id));
    const referenced = [
      ...SERVICES.map((service) => service.coverId),
      ...PROJECTS.flatMap((project) => [project.coverId, ...project.galleryIds]),
      ...POSTS.map((post) => post.coverId),
      ...TEAM_MEMBERS.map((member) => member.photoId),
      ...CLIENTS.map((client) => client.logoId),
      SITE_SETTINGS.logoId,
    ].filter((id): id is string => typeof id === 'string');

    for (const id of referenced) expect(mediaIds.has(id)).toBe(true);

    const projectIds = new Set(PROJECTS.map((project) => project.id));
    for (const id of SITE_SETTINGS.homepage.featuredProjectIds)
      expect(projectIds.has(id)).toBe(true);
  });
});
