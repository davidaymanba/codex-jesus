import type { ServiceCategory, ServiceOffering } from '@codex/shared';

/**
 * Every requestable service, grouped by pillar in display order (home page expertise grid,
 * quote form). Type-only imports keep zod out of the client bundles that use it.
 */
export const OFFERINGS_BY_PILLAR = {
  DEVELOPMENT: [
    'ECOMMERCE',
    'ELEARNING',
    'ERP',
    'CRM',
    'SALLA',
    'SHOPIFY',
    'WORDPRESS',
    'AI_AGENTS',
    'N8N_AUTOMATION',
  ],
  BRANDING: ['BRAND_STRATEGY', 'LOGO_DESIGN', 'VISUAL_IDENTITY', 'BRAND_GUIDELINES'],
  MARKETING: ['SOCIAL_MEDIA', 'CONTENT_CREATION', 'PAID_ADS', 'SEO'],
} as const satisfies Record<ServiceCategory, readonly ServiceOffering[]>;

export const PILLARS = Object.keys(OFFERINGS_BY_PILLAR) as ServiceCategory[];
