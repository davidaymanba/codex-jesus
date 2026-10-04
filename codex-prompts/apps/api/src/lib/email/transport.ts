import { Resend } from 'resend';

import { env } from '@/config/env.js';
import { logger, maskPii } from '@/lib/logger.js';

/** A rendered email ready to send. */
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** e.g. the client's address on lead notifications, so "Reply" reaches them. */
  replyTo?: string | undefined;
}

export interface EmailTransport {
  send(message: EmailMessage): Promise<void>;
}

/** Sends through Resend; an API error becomes an exception the queue retries. */
export function createResendTransport(apiKey: string, from: string): EmailTransport {
  const client = new Resend(apiKey);
  return {
    async send({ to, subject, html, text, replyTo }) {
      const { error } = await client.emails.send({
        from,
        to,
        subject,
        html,
        text,
        ...(replyTo && { replyTo }),
      });
      if (error) throw new Error(`Resend rejected the email: ${error.name}`);
    },
  };
}

/**
 * Development without a Resend key: logs that an email would be sent, with the masked
 * recipient only. Subjects and bodies stay out of logs: lead notification subjects carry the
 * client's name.
 */
export function createLogTransport(): EmailTransport {
  return {
    send({ to }) {
      logger.info({ to: maskPii(to, 'email') }, 'Email not sent (no RESEND_API_KEY)');
      return Promise.resolve();
    },
  };
}

export const emailTransport: EmailTransport = env.RESEND_API_KEY
  ? createResendTransport(env.RESEND_API_KEY, env.EMAIL_FROM)
  : createLogTransport();
