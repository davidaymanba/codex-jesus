import { MessageCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { getSiteSettings } from '@/lib/api/settings';
import { whatsAppHref } from '@/lib/utils/whatsapp';

/** Floating WhatsApp shortcut; hidden when the settings have no WhatsApp number. */
export async function WhatsAppButton() {
  const [settings, t] = await Promise.all([getSiteSettings(), getTranslations('whatsapp')]);
  const phone = settings?.contact.whatsapp;
  if (!phone) return null;

  return (
    <a
      href={whatsAppHref(phone, t('message'))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('label')}
      className="fixed end-5 bottom-5 z-30 inline-flex size-14 items-center justify-center rounded-full bg-gold-500 text-navy-950 shadow-lg transition-transform hover:scale-105 hover:bg-gold-400"
    >
      <MessageCircle aria-hidden className="size-7" />
    </a>
  );
}
