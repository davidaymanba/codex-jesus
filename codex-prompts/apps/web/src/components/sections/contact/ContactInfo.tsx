import { Mail, MapPin, MessageCircle, Phone, type LucideIcon } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';

import type { SiteSettingsDto } from '@codex/shared';

import { whatsAppHref } from '@/lib/utils/whatsapp';

interface InfoCard {
  key: string;
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
  isExternal?: boolean;
  isLtr?: boolean;
}

/** Phone, email, WhatsApp and address cards, then the social profiles (from the settings). */
export async function ContactInfo({ settings }: { settings: SiteSettingsDto }) {
  const [locale, t, tAll] = await Promise.all([
    getLocale(),
    getTranslations('contact.info'),
    getTranslations(),
  ]);
  const { contact, socials } = settings;
  const cards: InfoCard[] = [
    {
      key: 'email',
      icon: Mail,
      label: t('email'),
      value: contact.email,
      href: `mailto:${contact.email}`,
      isLtr: true,
    },
    {
      key: 'phone',
      icon: Phone,
      label: t('phone'),
      value: contact.phone,
      href: `tel:${contact.phone}`,
      isLtr: true,
    },
    ...(contact.whatsapp
      ? [
          {
            key: 'whatsapp',
            icon: MessageCircle,
            label: t('whatsapp'),
            value: t('whatsappAction'),
            href: whatsAppHref(contact.whatsapp, tAll('whatsapp.message')),
            isExternal: true,
          },
        ]
      : []),
    { key: 'address', icon: MapPin, label: t('address'), value: contact.address[locale] },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl">{t('title')}</h2>
      <ul className="grid gap-4">
        {cards.map(({ key, icon: Icon, label, value, href, isExternal, isLtr }) => (
          <li
            key={key}
            className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Icon aria-hidden className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-sm text-muted">{label}</span>
              {href ? (
                <a
                  href={href}
                  dir={isLtr ? 'ltr' : undefined}
                  className="w-fit font-medium break-all hover:text-primary"
                  {...(isExternal && { target: '_blank', rel: 'noopener noreferrer' })}
                >
                  {value}
                </a>
              ) : (
                <span className="font-medium">{value}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
      {socials.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h3 className="font-sans text-sm font-medium tracking-wide text-muted uppercase">
            {t('socials')}
          </h3>
          <ul className="flex flex-wrap gap-2">
            {socials.map(({ platform, url }) => (
              <li key={platform}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-medium hover:border-primary hover:text-primary"
                >
                  {tAll(`socialPlatforms.${platform}`)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
