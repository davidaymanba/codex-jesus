import { Text } from '@react-email/components';

import { BRAND_COLORS, DEFAULT_LOCALE, type Locale, type ServiceOffering } from '@codex/shared';

import { EmailLayout } from '../components/EmailLayout.js';
import { EmailHeading, Paragraph } from '../components/parts.js';
import { messagesFor } from '../messages/index.js';

export interface QuoteConfirmationProps {
  locale: Locale;
  name: string;
  services: ServiceOffering[];
}

/** To the client, in their language: we received the quote request, here is what happens next. */
export function QuoteConfirmation({ locale, name, services }: QuoteConfirmationProps) {
  const copy = messagesFor(locale).quoteConfirmation;
  const serviceLabels = messagesFor(locale).services;

  return (
    <EmailLayout locale={locale} preview={copy.subject}>
      <EmailHeading>{copy.heading(name)}</EmailHeading>
      <Paragraph>{copy.body}</Paragraph>
      <Paragraph>{copy.servicesIntro}</Paragraph>
      {services.map((service) => (
        <Text
          key={service}
          style={{ color: BRAND_COLORS.navy950, fontSize: '15px', margin: '0 0 6px' }}
        >
          • {serviceLabels[service]}
        </Text>
      ))}
      <Paragraph>{copy.nextSteps}</Paragraph>
    </EmailLayout>
  );
}

QuoteConfirmation.PreviewProps = {
  locale: DEFAULT_LOCALE,
  name: 'سارة',
  services: ['VISUAL_IDENTITY', 'SOCIAL_MEDIA'],
} satisfies QuoteConfirmationProps;

export default QuoteConfirmation;
