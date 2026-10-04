import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';

import { PageHero } from '@/components/content/PageHero';
import { ClientMessages } from '@/components/forms/ClientMessages';
import { ContactForm } from '@/components/sections/contact/ContactForm';
import { ContactInfo } from '@/components/sections/contact/ContactInfo';
import { MapEmbed } from '@/components/sections/contact/MapEmbed';
import { Section } from '@/components/shared/Section';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Toaster } from '@/components/ui/Toaster';
import { clientEnv } from '@/env/client';
import { getSiteSettings } from '@/lib/api/settings';
import { ROUTES } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('contact.meta')]);
  return buildMetadata({
    title: t('title'),
    description: t('description'),
    path: ROUTES.CONTACT,
    locale,
  });
}

/** /contact: the contact form, direct contact details, socials and an on-demand map. */
export default async function ContactPage() {
  const [locale, t, settings] = await Promise.all([
    getLocale(),
    getTranslations('contact'),
    getSiteSettings(),
  ]);
  const address = settings?.contact.address[locale];

  return (
    <>
      <PageHero
        locale={locale}
        breadcrumbs={[{ label: t('meta.title'), href: ROUTES.CONTACT }]}
        eyebrow={t('hero.eyebrow')}
        title={t('hero.title')}
        description={t('hero.description')}
      />
      <Section surface="light">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
            <h2 className="text-3xl">{t('form.title')}</h2>
            <p className="mt-3 mb-8 text-muted">{t('form.description')}</p>
            <ClientMessages namespaces={['contact', 'forms', 'validation', 'errors']}>
              <ContactForm
                apiUrl={clientEnv.NEXT_PUBLIC_API_URL}
                turnstileSiteKey={clientEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              />
              <Toaster />
            </ClientMessages>
          </div>
          {settings ? <ContactInfo settings={settings} /> : null}
        </div>
      </Section>
      {address ? (
        <Section surface="dark">
          <SectionHeading title={t('map.title')} />
          <div className="mt-10">
            <MapEmbed
              address={address}
              labels={{
                load: t('map.load'),
                notice: t('map.notice'),
                open: t('map.open'),
                frameTitle: t('map.frameTitle'),
              }}
            />
          </div>
        </Section>
      ) : null}
    </>
  );
}
