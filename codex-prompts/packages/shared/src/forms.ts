/**
 * The public form schemas and what the form UIs need, for browser bundles
 * (`@codex/shared/forms`). Unlike the package root, it does not build every API schema at
 * import time: only the contact and quote schemas and their helpers. Callers that render in
 * the browser must run `z.config({ jitless: true })` first (strict CSP: no `new Function`).
 */
export {
  contactFormSchema,
  quoteFormSchema,
  quoteStep1Schema,
  quoteStep2Schema,
  quoteStep3Schema,
  type ContactFormInput,
  type QuoteFormInput,
  type QuoteStep1Input,
  type QuoteStep2Input,
  type QuoteStep3Input,
} from './schemas/leads.js';
export { BudgetRange } from './enums/budget-range.js';
export { ProjectTimeline } from './enums/project-timeline.js';
export { ServiceOffering } from './enums/service-offering.js';
