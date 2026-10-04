import { Mail, MessageCircle, Phone } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';

import { CtaBanner } from '@/components/content/CtaBanner';
import { getSiteSettings } from '@/lib/api/settings';
import { ROUTES } from '@/lib/routes';
import { whatsAppHref } from '@/lib/utils/whatsapp';

const shortcutClasses =
  'inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm transition-colors hover:border-primary hover:text-primary';

/** Home section 12: the closing call to action, with direct contact shortcuts. */
export async function FinalCta() {
  const [locale, t, tWhatsApp, settings] = await Promise.all([
    getLocale(),
    getTranslations('home.cta'),
    getTranslations('whatsapp'),
    getSiteSettings(),
  ]);
  const cta = settings?.homepage.cta;
  const contact = settings?.contact;

  return (
    <CtaBanner
      title={cta?.title[locale] ?? t('title')}
      description={cta?.subtitle[locale] ?? t('subtitle')}
      primary={
        cta
          ? { label: cta.button.label[locale], href: cta.button.href }
          : { label: t('button'), href: ROUTES.QUOTE }
      }
      secondary={{ label: t('contact'), href: ROUTES.CONTACT }}
    >
      {contact ? (
        <div className="mt-10 flex flex-col items-center gap-4">
          <p className="text-sm text-muted">{t('shortcutsLabel')}</p>
          <ul className="flex flex-wrap justify-center gap-3">
            <li>
              <a href={`mailto:${contact.email}`} className={shortcutClasses}>
                <Mail aria-hidden className="size-4" />
                <span className="sr-only">{t('email')}: </span>
                <span dir="ltr">{contact.email}</span>
              </a>
            </li>
            <li>
              <a href={`tel:${contact.phone}`} className={shortcutClasses}>
                <Phone aria-hidden className="size-4" />
                <span className="sr-only">{t('phone')}: </span>
                <span dir="ltr">{contact.phone}</span>
              </a>
            </li>
            {contact.whatsapp ? (
              <li>
                <a
                  href={whatsAppHref(contact.whatsapp, tWhatsApp('message'))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={shortcutClasses}
                >
                  <MessageCircle aria-hidden className="size-4" />
                  {t('whatsapp')}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </CtaBanner>
  );
}
