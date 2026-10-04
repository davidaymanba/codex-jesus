import {
  createClientSchema,
  createTeamMemberSchema,
  createTestimonialSchema,
  createUserSchema,
  Role,
  siteSettingsSchema,
} from '@codex/shared';

import type { PrismaClient } from '@/generated/prisma/client.js';
import { hashPassword } from '@/utils/password.js';

import { toJson } from './builders.js';
import { CLIENTS, TEAM_MEMBERS, TESTIMONIALS } from './data/showcase.js';
import { SITE_SETTINGS } from './data/site-settings.js';
import type { SeedEnv } from './env.js';

const SITE_SETTINGS_ID = 1;

/**
 * Creates the first admin once. An existing account is left untouched, so re-running the
 * seed never resets a password that was changed in the dashboard.
 */
export async function seedAdmin(db: PrismaClient, env: SeedEnv): Promise<string> {
  const admin = createUserSchema.parse({
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
    role: Role.ADMIN,
  });
  const existing = await db.user.findUnique({
    where: { email: admin.email },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await db.user.create({
    data: {
      name: admin.name,
      email: admin.email,
      passwordHash: await hashPassword(admin.password),
      role: admin.role,
      isActive: admin.isActive,
    },
    select: { id: true },
  });
  return created.id;
}

export async function seedShowcase(db: PrismaClient): Promise<void> {
  for (const { id, ...record } of TESTIMONIALS) {
    const testimonial = createTestimonialSchema.parse(record);
    await db.testimonial.upsert({
      where: { id },
      create: {
        id,
        ...testimonial,
        company: testimonial.company ?? null,
        photoId: testimonial.photoId ?? null,
        role: toJson(testimonial.role),
        quote: toJson(testimonial.quote),
      },
      update: {},
    });
  }
  for (const { id, ...record } of TEAM_MEMBERS) {
    const member = createTeamMemberSchema.parse(record);
    await db.teamMember.upsert({
      where: { id },
      create: {
        id,
        ...member,
        photoId: member.photoId ?? null,
        name: toJson(member.name),
        role: toJson(member.role),
        bio: toJson(member.bio),
        socials: toJson(member.socials),
      },
      update: {},
    });
  }
  for (const { id, ...record } of CLIENTS) {
    const client = createClientSchema.parse(record);
    await db.client.upsert({
      where: { id },
      create: { id, ...client, logoId: client.logoId ?? null, website: client.website ?? null },
      update: {},
    });
  }
}

export async function seedSiteSettings(db: PrismaClient): Promise<void> {
  const settings = siteSettingsSchema.parse(SITE_SETTINGS);
  await db.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    create: {
      id: SITE_SETTINGS_ID,
      companyName: toJson(settings.companyName),
      logoId: settings.logoId ?? null,
      contact: toJson(settings.contact),
      socials: toJson(settings.socials),
      defaultSeo: toJson(settings.defaultSeo),
      ogImageId: settings.ogImageId ?? null,
      homepage: toJson(settings.homepage),
    },
    update: {},
  });
}
