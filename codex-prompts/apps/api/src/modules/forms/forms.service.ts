import {
  renderContactConfirmation,
  renderNewLeadNotification,
  renderQuoteConfirmation,
} from '@codex/emails';
import {
  DEFAULT_LOCALE,
  type ContactSubmissionInput,
  type QuoteSubmissionInput,
} from '@codex/shared';

import { USER_AGENT_MAX_LENGTH } from '@/config/constants.js';
import { env } from '@/config/env.js';
import { emailQueue } from '@/lib/email/queue.js';
import { hashIp } from '@/lib/hash.js';
import type { ClientContext } from '@/modules/auth/auth.types.js';

import { FormsRepository } from './forms.repository.js';

const forms = new FormsRepository();
// The company inbox reads Arabic first (the site's default locale).
const COMPANY_LOCALE = DEFAULT_LOCALE;

/** Link to a lead in the admin UI (the pages arrive in Phase 6). */
const adminLink = (path: string) => new URL(path, env.ADMIN_URL ?? env.FRONTEND_URL).toString();

/** Saves a quote request and queues the company notification and the client confirmation. */
export async function submitQuote(
  { turnstileToken: _token, website: _honeypot, ...input }: QuoteSubmissionInput,
  client: ClientContext,
): Promise<void> {
  const id = await forms.createQuoteRequest(input, {
    ipHash: hashIp(client.ip),
    userAgent: client.userAgent?.slice(0, USER_AGENT_MAX_LENGTH) ?? null,
  });
  emailQueue.enqueue({
    name: 'quote-notification',
    build: async () => ({
      to: env.EMAIL_NOTIFY_TO,
      replyTo: input.email,
      ...(await renderNewLeadNotification({
        ...input,
        kind: 'quote',
        locale: COMPANY_LOCALE,
        adminUrl: adminLink(`/admin/quotes/${id}`),
      })),
    }),
  });
  emailQueue.enqueue({
    name: 'quote-confirmation',
    build: async () => ({ to: input.email, ...(await renderQuoteConfirmation(input)) }),
  });
}

/** Saves a contact message and queues the company notification and the client confirmation. */
export async function submitContact(
  { turnstileToken: _token, website: _honeypot, ...input }: ContactSubmissionInput,
  client: ClientContext,
): Promise<void> {
  const id = await forms.createContactMessage(input, hashIp(client.ip));
  emailQueue.enqueue({
    name: 'contact-notification',
    build: async () => ({
      to: env.EMAIL_NOTIFY_TO,
      replyTo: input.email,
      ...(await renderNewLeadNotification({
        ...input,
        kind: 'contact',
        locale: COMPANY_LOCALE,
        adminUrl: adminLink(`/admin/messages/${id}`),
      })),
    }),
  });
  emailQueue.enqueue({
    name: 'contact-confirmation',
    build: async () => ({ to: input.email, ...(await renderContactConfirmation(input)) }),
  });
}
