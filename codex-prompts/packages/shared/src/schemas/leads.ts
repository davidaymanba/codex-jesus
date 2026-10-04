import { z } from 'zod';

import {
  emailSchema,
  emptyToUndefined,
  idSchema,
  localeSchema,
  objectSchema,
  personNameSchema,
  phoneSchema,
  requiredString,
  searchQuerySchema,
  uniqueArray,
} from './common.js';
import {
  createSortSchema,
  dateRangeFields,
  paginationSchema,
  refineDateRange,
} from './pagination.js';
import { FIELD_LIMITS } from '../constants/field-limits.js';
import { HONEYPOT_FIELD } from '../constants/forms.js';
import { VALIDATION_MESSAGES as MSG } from '../constants/validation-messages.js';
import { budgetRangeSchema } from '../enums/budget-range.js';
import { contactStatusSchema } from '../enums/contact-status.js';
import { leadStatusSchema } from '../enums/lead-status.js';
import { projectTimelineSchema } from '../enums/project-timeline.js';
import { ServiceOffering, serviceOfferingSchema } from '../enums/service-offering.js';

const optionalPhoneSchema = emptyToUndefined(phoneSchema.optional());
const optionalCompanySchema = emptyToUndefined(
  requiredString({ max: FIELD_LIMITS.COMPANY_MAX }).optional(),
);
const leadSort = createSortSchema(['createdAt', 'updatedAt'], {
  sortBy: 'createdAt',
  sortOrder: 'desc',
}).shape;

// ─── Quote request (multi-step public form) ───────────────────────────────────

/** Step 1: which services the visitor needs. */
export const quoteStep1Schema = objectSchema({
  services: uniqueArray(serviceOfferingSchema, {
    min: 1,
    max: Object.keys(ServiceOffering).length,
  }),
});

/** Step 2: project details, budget and timeline. */
export const quoteStep2Schema = objectSchema({
  projectDetails: requiredString({
    min: FIELD_LIMITS.QUOTE_DETAILS.MIN,
    max: FIELD_LIMITS.QUOTE_DETAILS.MAX,
  }),
  budgetRange: budgetRangeSchema,
  timeline: projectTimelineSchema,
});

/** Step 3: contact details. Phone and company are optional (collect only what we need). */
export const quoteStep3Schema = objectSchema({
  name: personNameSchema,
  email: emailSchema,
  phone: optionalPhoneSchema,
  company: optionalCompanySchema,
});

/** Full submission: all three steps plus the UI locale. */
export const quoteFormSchema = objectSchema({
  ...quoteStep1Schema.shape,
  ...quoteStep2Schema.shape,
  ...quoteStep3Schema.shape,
  locale: localeSchema,
});

export const updateQuoteRequestSchema = objectSchema({
  status: leadStatusSchema,
  internalNotes: requiredString({ max: FIELD_LIMITS.INTERNAL_NOTES_MAX }).nullable(),
  assignedToId: idSchema.nullable(),
}).partial();

const quoteRequestFilters = {
  status: leadStatusSchema.optional(),
  service: serviceOfferingSchema.optional(),
  assignedToId: idSchema.optional(),
  q: searchQuerySchema.optional(),
  ...dateRangeFields,
};

export const quoteRequestQuerySchema = paginationSchema
  .extend(quoteRequestFilters)
  .extend(leadSort)
  .superRefine(refineDateRange);

/** CSV export: the list filters, without paging (the export streams every match). */
export const quoteRequestExportQuerySchema =
  objectSchema(quoteRequestFilters).superRefine(refineDateRange);

// ─── Contact message ──────────────────────────────────────────────────────────

export const contactFormSchema = objectSchema({
  name: personNameSchema,
  email: emailSchema,
  phone: optionalPhoneSchema,
  message: requiredString({
    min: FIELD_LIMITS.CONTACT_MESSAGE.MIN,
    max: FIELD_LIMITS.CONTACT_MESSAGE.MAX,
  }),
  locale: localeSchema,
});

export const updateContactMessageSchema = objectSchema({ status: contactStatusSchema }).partial();

const contactMessageFilters = {
  status: contactStatusSchema.optional(),
  q: searchQuerySchema.optional(),
  ...dateRangeFields,
};

export const contactMessageQuerySchema = paginationSchema
  .extend(contactMessageFilters)
  .extend(leadSort)
  .superRefine(refineDateRange);

export const contactMessageExportQuerySchema =
  objectSchema(contactMessageFilters).superRefine(refineDateRange);

// ─── Public submissions (form fields + bot protection) ────────────────────────

/**
 * Bot protection sent with every public form: the Turnstile token and the honeypot. The API
 * checks both before validating the form; a filled honeypot is accepted and discarded.
 */
export const formBotFieldsSchema = objectSchema({
  [HONEYPOT_FIELD]: z
    .string({ error: MSG.INVALID_TYPE })
    .max(FIELD_LIMITS.HONEYPOT_MAX, { error: MSG.TOO_LONG })
    .optional(),
  turnstileToken: requiredString({ max: FIELD_LIMITS.OPAQUE_TOKEN_MAX }),
});

export const contactSubmissionSchema = contactFormSchema.extend(formBotFieldsSchema.shape);
export const quoteSubmissionSchema = quoteFormSchema.extend(formBotFieldsSchema.shape);

export type QuoteStep1Input = z.infer<typeof quoteStep1Schema>;
export type QuoteStep2Input = z.infer<typeof quoteStep2Schema>;
export type QuoteStep3Input = z.infer<typeof quoteStep3Schema>;
export type QuoteFormInput = z.infer<typeof quoteFormSchema>;
export type UpdateQuoteRequestInput = z.infer<typeof updateQuoteRequestSchema>;
export type QuoteRequestQuery = z.infer<typeof quoteRequestQuerySchema>;
export type QuoteRequestExportQuery = z.infer<typeof quoteRequestExportQuerySchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type UpdateContactMessageInput = z.infer<typeof updateContactMessageSchema>;
export type ContactMessageQuery = z.infer<typeof contactMessageQuerySchema>;
export type ContactMessageExportQuery = z.infer<typeof contactMessageExportQuerySchema>;
export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;
export type QuoteSubmissionInput = z.infer<typeof quoteSubmissionSchema>;
