import { DEFAULT_LOCALE, type Locale } from '@codex/shared';

import { EmailLayout } from '../components/EmailLayout.js';
import { EmailHeading, Paragraph } from '../components/parts.js';
import { messagesFor } from '../messages/index.js';

export interface ContactConfirmationProps {
  locale: Locale;
  name: string;
}

/** To the client, in their language: their message arrived. */
export function ContactConfirmation({ locale, name }: ContactConfirmationProps) {
  const copy = messagesFor(locale).contactConfirmation;

  return (
    <EmailLayout locale={locale} preview={copy.subject}>
      <EmailHeading>{copy.heading(name)}</EmailHeading>
      <Paragraph>{copy.body}</Paragraph>
    </EmailLayout>
  );
}

ContactConfirmation.PreviewProps = {
  locale: DEFAULT_LOCALE,
  name: 'عمر',
} satisfies ContactConfirmationProps;

export default ContactConfirmation;
