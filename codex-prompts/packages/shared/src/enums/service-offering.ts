import { z } from 'zod';

import { VALIDATION_MESSAGES } from '../constants/validation-messages.js';

/** Individual services a visitor can request a quote for, grouped by pillar in the UI. */
export const ServiceOffering = {
  ECOMMERCE: 'ECOMMERCE',
  ELEARNING: 'ELEARNING',
  ERP: 'ERP',
  CRM: 'CRM',
  SALLA: 'SALLA',
  SHOPIFY: 'SHOPIFY',
  WORDPRESS: 'WORDPRESS',
  AI_AGENTS: 'AI_AGENTS',
  N8N_AUTOMATION: 'N8N_AUTOMATION',
  BRAND_STRATEGY: 'BRAND_STRATEGY',
  LOGO_DESIGN: 'LOGO_DESIGN',
  VISUAL_IDENTITY: 'VISUAL_IDENTITY',
  BRAND_GUIDELINES: 'BRAND_GUIDELINES',
  SOCIAL_MEDIA: 'SOCIAL_MEDIA',
  CONTENT_CREATION: 'CONTENT_CREATION',
  PAID_ADS: 'PAID_ADS',
  SEO: 'SEO',
} as const;

export type ServiceOffering = (typeof ServiceOffering)[keyof typeof ServiceOffering];

export const serviceOfferingSchema = z.enum(ServiceOffering, {
  error: VALIDATION_MESSAGES.INVALID_OPTION,
});
