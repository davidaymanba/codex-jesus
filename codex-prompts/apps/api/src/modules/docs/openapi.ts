import { createDocument, type ZodOpenApiPathsObject } from 'zod-openapi';

import { AUTH_COOKIES, CSRF_HEADER } from '@codex/shared';

import { auditLogPaths } from '@/modules/audit-log/audit-log.openapi.js';
import { authPaths } from '@/modules/auth/auth.openapi.js';
import { categoryPaths } from '@/modules/categories/categories.openapi.js';
import { clientsPaths } from '@/modules/clients/clients.openapi.js';
import { dashboardPaths } from '@/modules/dashboard/dashboard.openapi.js';
import { formPaths } from '@/modules/forms/forms.openapi.js';
import { healthPaths } from '@/modules/health/health.openapi.js';
import { leadPathsDocs } from '@/modules/leads/leads.openapi.js';
import { mediaPaths } from '@/modules/media/media.openapi.js';
import { postPaths } from '@/modules/posts/posts.openapi.js';
import { projectPaths } from '@/modules/projects/projects.openapi.js';
import { servicePaths } from '@/modules/services/services.openapi.js';
import { settingsPaths } from '@/modules/settings/settings.openapi.js';
import { sitemapPaths } from '@/modules/sitemap/sitemap.openapi.js';
import { tagPaths } from '@/modules/tags/tags.openapi.js';
import { teamPaths } from '@/modules/team/team.openapi.js';
import { testimonialsPaths } from '@/modules/testimonials/testimonials.openapi.js';
import { userPaths } from '@/modules/users/users.openapi.js';

/** Every module's documented paths; a test checks this covers every mounted route. */
export const documentedPaths: ZodOpenApiPathsObject = {
  ...healthPaths,
  ...authPaths,
  ...categoryPaths,
  ...tagPaths,
  ...servicePaths,
  ...projectPaths,
  ...postPaths,
  ...testimonialsPaths,
  ...teamPaths,
  ...clientsPaths,
  ...settingsPaths,
  ...sitemapPaths,
  ...formPaths,
  ...leadPathsDocs,
  ...userPaths,
  ...dashboardPaths,
  ...auditLogPaths,
  ...mediaPaths,
};

/** Builds the OpenAPI 3.1 document from the shared zod schemas. */
export function buildOpenApiDocument(): ReturnType<typeof createDocument> {
  return createDocument({
    openapi: '3.1.0',
    info: {
      title: 'Codex API',
      version: '1.0.0',
      description:
        'Errors use `{ success: false, error: { code, message, details?, requestId } }`; ' +
        '`message` and `details[].message` are i18n keys.',
    },
    paths: documentedPaths,
    components: {
      securitySchemes: {
        accessTokenCookie: { type: 'apiKey', in: 'cookie', name: AUTH_COOKIES.ACCESS_TOKEN },
        refreshTokenCookie: { type: 'apiKey', in: 'cookie', name: AUTH_COOKIES.REFRESH_TOKEN },
        csrfHeader: { type: 'apiKey', in: 'header', name: CSRF_HEADER },
      },
    },
  });
}
