import { zodResolver } from '@hookform/resolvers/zod';

import { contactFormSchema } from '@/lib/forms/schemas';

/** The visitor's part of the contact form; the locale is added on submit. */
export const contactFieldsSchema = contactFormSchema.omit({ locale: true });

/** Loaded on demand by ContactForm (see lazy-resolver.ts). */
export const contactResolver = zodResolver(contactFieldsSchema);
