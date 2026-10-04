import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { BRAND_COLORS } from '@codex/shared';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Providers } from '@/components/layout/Providers';
import { MAIN_CONTENT_ID, SkipLink } from '@/components/layout/SkipLink';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { clientEnv } from '@/env/client';
import { FONT_PRELOADS, FONT_STACK_CLASS } from '@/lib/fonts';
import { CLIENT_NAMESPACES } from '@/lib/i18n/client-namespaces';
import { directionOf } from '@/lib/i18n/localized';
import { routing } from '@/lib/i18n/routing';
import { buildMetadata, SITE_NAME } from '@/lib/seo/metadata';

import '@/styles/fonts.css';
import '@/styles/globals.css';

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export const viewport: Viewport = { themeColor: BRAND_COLORS.navy950 };

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    metadataBase: new URL(clientEnv.NEXT_PUBLIC_SITE_URL),
    applicationName: SITE_NAME,
    ...buildMetadata({
      title: t('defaultTitle'),
      description: t('defaultDescription'),
      path: '/',
      locale,
    }),
    title: { default: t('defaultTitle'), template: `%s | ${SITE_NAME}` },
  };
}

function pickClientMessages(messages: Awaited<ReturnType<typeof getMessages>>) {
  return Object.fromEntries(CLIENT_NAMESPACES.map((namespace) => [namespace, messages[namespace]]));
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  // Every page renders per request: the CSP nonce is new each time (docs/phases/04 §10).
  await connection();
  const messages = await getMessages();
  const dir = directionOf(locale);

  return (
    <html lang={locale} dir={dir} className={FONT_STACK_CLASS[locale]}>
      <head>
        {FONT_PRELOADS[locale].map((href) => (
          <link
            key={href}
            rel="preload"
            href={href}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        ))}
      </head>
      <body className="flex min-h-dvh flex-col">
        <NextIntlClientProvider messages={pickClientMessages(messages)}>
          <Providers dir={dir}>
            <SkipLink />
            <Header />
            <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 outline-none">
              {children}
            </main>
            <Footer />
            <WhatsAppButton />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
