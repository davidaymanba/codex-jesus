import { DEFAULT_LOCALE, type Locale } from '@codex/shared';

import { EmailLayout } from '../components/EmailLayout.js';
import { EmailHeading, Paragraph, PrimaryButton } from '../components/parts.js';
import { messagesFor } from '../messages/index.js';

export interface PasswordResetProps {
  locale: Locale;
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
}

/** To an admin user: a single-use link to choose a new password. */
export function PasswordReset({ locale, name, resetUrl, expiresInMinutes }: PasswordResetProps) {
  const copy = messagesFor(locale).passwordReset;

  return (
    <EmailLayout locale={locale} preview={copy.subject}>
      <EmailHeading>{copy.heading(name)}</EmailHeading>
      <Paragraph>{copy.body(expiresInMinutes)}</Paragraph>
      <PrimaryButton href={resetUrl}>{copy.button}</PrimaryButton>
      <Paragraph>{copy.ignore}</Paragraph>
    </EmailLayout>
  );
}

PasswordReset.PreviewProps = {
  locale: DEFAULT_LOCALE,
  name: 'Codex Admin',
  resetUrl: 'http://localhost:3000/admin/reset-password?token=preview',
  expiresInMinutes: 60,
} satisfies PasswordResetProps;

export default PasswordReset;
