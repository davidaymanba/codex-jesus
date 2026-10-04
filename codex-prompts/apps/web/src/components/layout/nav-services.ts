import type { Locale, ServiceSummaryDto } from '@codex/shared';

import { localized } from '@/lib/i18n/localized';
import { serviceRoute } from '@/lib/routes';

import type { NavService } from './DesktopNav';

/** Published services as navigation entries, linked by the locale's slug. */
export function toNavServices(services: ServiceSummaryDto[], locale: Locale): NavService[] {
  return services.map((service) => ({
    href: serviceRoute(locale === 'ar' ? service.slugAr : service.slugEn),
    title: localized(service.title, locale),
    description: localized(service.shortDescription, locale),
  }));
}
