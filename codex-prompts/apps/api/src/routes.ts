import type { Router } from 'express';

import { auditLogRouter } from '@/modules/audit-log/audit-log.routes.js';
import { authRouter } from '@/modules/auth/auth.routes.js';
import { categoriesRouter } from '@/modules/categories/categories.routes.js';
import { clientsRouter } from '@/modules/clients/clients.routes.js';
import { contactRouter } from '@/modules/contact/contact.routes.js';
import { dashboardRouter } from '@/modules/dashboard/dashboard.routes.js';
import { formsRouter } from '@/modules/forms/forms.routes.js';
import { mediaRouter } from '@/modules/media/media.routes.js';
import { postsRouter } from '@/modules/posts/posts.routes.js';
import { projectsRouter } from '@/modules/projects/projects.routes.js';
import { quotesRouter } from '@/modules/quotes/quotes.routes.js';
import { servicesRouter } from '@/modules/services/services.routes.js';
import { settingsRouter } from '@/modules/settings/settings.routes.js';
import { sitemapRouter } from '@/modules/sitemap/sitemap.routes.js';
import { tagsRouter } from '@/modules/tags/tags.routes.js';
import { teamRouter } from '@/modules/team/team.routes.js';
import { testimonialsRouter } from '@/modules/testimonials/testimonials.routes.js';
import { usersRouter } from '@/modules/users/users.routes.js';

/** Feature routers mounted under `/api/v1`. Each defines full paths (e.g. `/auth/login`). */
export const apiRouters: readonly Router[] = [
  authRouter,
  categoriesRouter,
  tagsRouter,
  servicesRouter,
  projectsRouter,
  postsRouter,
  testimonialsRouter,
  teamRouter,
  clientsRouter,
  settingsRouter,
  sitemapRouter,
  formsRouter,
  quotesRouter,
  contactRouter,
  usersRouter,
  dashboardRouter,
  auditLogRouter,
  mediaRouter,
];
