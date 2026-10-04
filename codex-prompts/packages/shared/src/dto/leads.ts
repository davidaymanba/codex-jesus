import { z } from 'zod';

import { timestampDtoSchema } from './common.js';
import { LOCALES } from '../constants/locales.js';
import { budgetRangeSchema } from '../enums/budget-range.js';
import { contactStatusSchema } from '../enums/contact-status.js';
import { leadStatusSchema } from '../enums/lead-status.js';
import { projectTimelineSchema } from '../enums/project-timeline.js';
import { serviceOfferingSchema } from '../enums/service-offering.js';

const userRefDtoSchema = z.object({ id: z.uuid(), name: z.string() });

/** A quote request as the admin sees it (never the IP hash or user agent). */
export const quoteRequestDtoSchema = z.object({
  id: z.uuid(),
  services: z.array(serviceOfferingSchema),
  projectDetails: z.string(),
  budgetRange: budgetRangeSchema,
  timeline: projectTimelineSchema,
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  company: z.string().nullable(),
  locale: z.enum(LOCALES),
  status: leadStatusSchema,
  internalNotes: z.string().nullable(),
  assignedTo: userRefDtoSchema.nullable(),
  createdAt: timestampDtoSchema,
  updatedAt: timestampDtoSchema,
});

export const contactMessageDtoSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  message: z.string(),
  locale: z.enum(LOCALES),
  status: contactStatusSchema,
  createdAt: timestampDtoSchema,
  updatedAt: timestampDtoSchema,
});

export type QuoteRequestDto = z.infer<typeof quoteRequestDtoSchema>;
export type ContactMessageDto = z.infer<typeof contactMessageDtoSchema>;
