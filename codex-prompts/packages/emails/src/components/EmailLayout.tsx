import { Body, Container, Head, Html, Preview, Section, Text } from '@react-email/components';
import type { ReactNode } from 'react';

import { BRAND_COLORS, RTL_LOCALES, type Locale } from '@codex/shared';

import { messagesFor } from '../messages/index.js';

// Web fonts are unreliable in email clients: system stacks per script.
const FONT_STACK = {
  ar: "Tahoma, 'Segoe UI', Arial, sans-serif",
  en: "'Helvetica Neue', Helvetica, Arial, sans-serif",
} as const satisfies Record<Locale, string>;

export interface EmailLayoutProps {
  locale: Locale;
  preview: string;
  children: ReactNode;
}

/**
 * Branded frame for every email: navy header with the `{}` wordmark, a white card on a
 * lavender background, and a muted footer. Direction and fonts follow the locale.
 */
export function EmailLayout({ locale, preview, children }: EmailLayoutProps) {
  const dir = RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';
  const copy = messagesFor(locale);
  const textAlign = dir === 'rtl' ? 'right' : 'left';

  return (
    <Html lang={locale} dir={dir}>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: BRAND_COLORS.lavender50,
          fontFamily: FONT_STACK[locale],
          margin: 0,
          padding: '24px 0',
        }}
      >
        <Container style={{ maxWidth: '600px', width: '100%' }}>
          <Section
            style={{
              backgroundColor: BRAND_COLORS.navy950,
              borderRadius: '16px 16px 0 0',
              padding: '24px 32px',
              textAlign,
            }}
          >
            <Text
              style={{ color: BRAND_COLORS.white, fontSize: '24px', fontWeight: 700, margin: 0 }}
            >
              <span style={{ color: BRAND_COLORS.gold500 }}>{'{ '}</span>
              {copy.brand.name}
              <span style={{ color: BRAND_COLORS.gold500 }}>{' }'}</span>
            </Text>
            <Text style={{ color: BRAND_COLORS.lavender200, fontSize: '13px', margin: '4px 0 0' }}>
              {copy.brand.tagline}
            </Text>
          </Section>
          <Section
            style={{
              backgroundColor: BRAND_COLORS.white,
              borderRadius: '0 0 16px 16px',
              padding: '32px',
              textAlign,
            }}
          >
            {children}
          </Section>
          <Text
            style={{
              color: BRAND_COLORS.indigo700,
              fontSize: '12px',
              padding: '16px 32px 0',
              textAlign,
            }}
          >
            {copy.brand.footer}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
