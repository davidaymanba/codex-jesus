import { env } from '@/config/env.js';
import { logger } from '@/lib/logger.js';
import { prisma } from '@/lib/prisma.js';

import { seedMedia, seedPosts, seedProjects, seedServices, seedTaxonomy } from './content.js';
import { parseSeedEnv, SeedEnvError } from './env.js';
import { seedAdmin, seedShowcase, seedSiteSettings } from './settings.js';

/**
 * Idempotent seed. Demo content (projects, posts, testimonials, team, clients) is skipped in
 * production so placeholder testimonials or clients can never go live by accident.
 */
async function main(): Promise<void> {
  const seedEnv = parseSeedEnv(process.env);
  const withDemoContent = env.NODE_ENV !== 'production';

  const adminId = await seedAdmin(prisma, seedEnv);
  await seedMedia(prisma);
  await seedServices(prisma);
  await seedSiteSettings(prisma);

  if (withDemoContent) {
    await seedTaxonomy(prisma);
    await seedProjects(prisma);
    await seedPosts(prisma, adminId);
    await seedShowcase(prisma);
  }

  logger.info({ withDemoContent, ...(await countSeededRows()) }, 'Seed complete');
}

/** Row counts per seeded table, logged so a re-run visibly creates nothing new. */
async function countSeededRows(): Promise<Record<string, number>> {
  const counts = await prisma.$transaction([
    prisma.user.count(),
    prisma.media.count(),
    prisma.service.count(),
    prisma.category.count(),
    prisma.tag.count(),
    prisma.project.count(),
    prisma.projectGalleryImage.count(),
    prisma.post.count(),
    prisma.testimonial.count(),
    prisma.teamMember.count(),
    prisma.client.count(),
    prisma.siteSettings.count(),
  ]);
  const [
    users,
    media,
    services,
    categories,
    tags,
    projects,
    gallery,
    posts,
    testimonials,
    team,
    clients,
    settings,
  ] = counts;
  return {
    users,
    media,
    services,
    categories,
    tags,
    projects,
    gallery,
    posts,
    testimonials,
    team,
    clients,
    settings,
  };
}

try {
  await main();
} catch (error) {
  if (error instanceof SeedEnvError) {
    process.stderr.write(`\n${error.message}\n\nSet them in apps/api/.env (see .env.example).\n\n`);
  } else {
    logger.fatal({ err: error }, 'Seed failed');
  }
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
