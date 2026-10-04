import type { routing } from './lib/i18n/routing';
import type messages from './messages/en.json';

// Type-safe translation keys and locales across `useTranslations` / `getTranslations`.
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
