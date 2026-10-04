import { Mail, MapPin, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { Locale, SiteSettingsDto } from '@codex/shared';

import { localized } from '@/lib/i18n/localized';

interface FooterContactProps {
  settings: SiteSettingsDto;
  locale: Locale;
}

/** Contact details and social profiles from the site settings. */
export function FooterContact({ settings, locale }: FooterContactProps) {
  const t = useTranslations();
  const { contact, socials } = settings;

  return (
    <div>
      <h2 className="mb-4 font-sans text-sm font-medium tracking-wide text-muted uppercase">
        {t('footer.contactTitle')}
      </h2>
      <address className="grid gap-3 not-italic">
        <a
          href={`mailto:${contact.email}`}
          className="inline-flex items-center gap-2 hover:text-primary"
        >
          <Mail aria-hidden className="size-4 text-muted" />
          <span className="sr-only">{t('footer.email')}: </span>
          {contact.email}
        </a>
        <a
          href={`tel:${contact.phone}`}
          className="inline-flex items-center gap-2 hover:text-primary"
        >
          <Phone aria-hidden className="size-4 text-muted" />
          <span className="sr-only">{t('footer.phone')}: </span>
          {/* Phone numbers read left to right in Arabic text too. */}
          <bdi dir="ltr">{contact.phone}</bdi>
        </a>
        <p className="inline-flex items-start gap-2 text-muted">
          <MapPin aria-hidden className="mt-1 size-4 shrink-0" />
          <span className="sr-only">{t('footer.address')}: </span>
          {localized(contact.address, locale)}
        </p>
      </address>
      {socials.length > 0 ? (
        <ul
          aria-label={t('footer.followTitle')}
          className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm"
        >
          {socials.map(({ platform, url }) => (
            <li key={platform}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                {t(`socialPlatforms.${platform}`)}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
