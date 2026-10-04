import { messagesFor } from './messages/index.js';
import { renderEmail, type RenderedEmail } from './render.js';
import {
  ContactConfirmation,
  type ContactConfirmationProps,
} from './templates/ContactConfirmation.js';
import {
  NewLeadNotification,
  type NewLeadNotificationProps,
} from './templates/NewLeadNotification.js';
import { PasswordReset, type PasswordResetProps } from './templates/PasswordReset.js';
import { QuoteConfirmation, type QuoteConfirmationProps } from './templates/QuoteConfirmation.js';

/** A ready-to-send email: localized subject plus HTML and plain-text bodies. */
export interface EmailContent extends RenderedEmail {
  subject: string;
}

/** Notification to the company inbox about a new lead. */
export async function renderNewLeadNotification(
  props: NewLeadNotificationProps,
): Promise<EmailContent> {
  const copy = messagesFor(props.locale).newLead;
  const subject =
    props.kind === 'quote' ? copy.quoteSubject(props.name) : copy.contactSubject(props.name);
  return { subject, ...(await renderEmail(<NewLeadNotification {...props} />)) };
}

export async function renderQuoteConfirmation(
  props: QuoteConfirmationProps,
): Promise<EmailContent> {
  const { subject } = messagesFor(props.locale).quoteConfirmation;
  return { subject, ...(await renderEmail(<QuoteConfirmation {...props} />)) };
}

export async function renderContactConfirmation(
  props: ContactConfirmationProps,
): Promise<EmailContent> {
  const { subject } = messagesFor(props.locale).contactConfirmation;
  return { subject, ...(await renderEmail(<ContactConfirmation {...props} />)) };
}

export async function renderPasswordReset(props: PasswordResetProps): Promise<EmailContent> {
  const { subject } = messagesFor(props.locale).passwordReset;
  return { subject, ...(await renderEmail(<PasswordReset {...props} />)) };
}
