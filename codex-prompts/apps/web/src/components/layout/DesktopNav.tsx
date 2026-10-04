'use client';

import { useTranslations } from 'next-intl';

import { Link, usePathname } from '@/lib/i18n/navigation';
import { MAIN_NAV, ROUTES } from '@/lib/routes';

import { ServicesMenu } from './ServicesMenu';

export interface NavService {
  href: string;
  title: string;
  description: string;
}

const linkClasses =
  'inline-flex h-11 items-center gap-1 rounded-full px-3 text-sm font-medium text-fg/85 transition-colors hover:text-fg aria-[current=page]:text-fg';

const isActive = (pathname: string, href: string) =>
  href === ROUTES.HOME ? pathname === href : pathname.startsWith(href);

/** Desktop navigation; "Services" opens a list of the published services. */
export function DesktopNav({ services }: { services: NavService[] }) {
  const t = useTranslations('nav');
  const a11y = useTranslations('a11y');
  const pathname = usePathname();

  return (
    <nav aria-label={a11y('mainNavigation')} className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {MAIN_NAV.map(({ key, href }) => (
          <li key={key}>
            {key === 'services' ? (
              <ServicesMenu
                label={t(key)}
                allServicesLabel={t('allServices')}
                services={services}
                triggerClassName={linkClasses}
              />
            ) : (
              <Link
                href={href}
                aria-current={isActive(pathname, href) ? 'page' : undefined}
                className={linkClasses}
              >
                {t(key)}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
