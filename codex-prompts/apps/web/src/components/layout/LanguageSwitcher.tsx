'use client';

import { Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { LOCALES, type Locale } from '@codex/shared/constants';

import { Link, usePathname } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils/cn';

import { useAlternatePaths } from './AlternatePaths';

/**
 * Links to the same page in the other language (two locales: a toggle). Dynamic pages
 * register their localized path; everything else keeps its path. The next request stores the
 * choice in the locale cookie.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations('languageSwitcher');
  const locale = useLocale();
  const pathname = usePathname();
  const alternates = useAlternatePaths();
  const target: Locale = LOCALES.find((candidate) => candidate !== locale) ?? locale;

  return (
    <Link
      href={alternates[target] ?? pathname}
      locale={target}
      hrefLang={target}
      aria-label={`${t('label')}: ${t(target)}`}
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-fg transition-colors hover:text-primary',
        className,
      )}
    >
      <Languages aria-hidden className="size-4" />
      <span lang={target}>{t(target)}</span>
    </Link>
  );
}
