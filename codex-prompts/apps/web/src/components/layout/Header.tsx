import { getLocale, getTranslations } from 'next-intl/server';

import { Container } from '@/components/shared/Container';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/Button';
import { getNavigationServices } from '@/lib/api/services';
import { Link } from '@/lib/i18n/navigation';
import { ROUTES } from '@/lib/routes';

import { DesktopNav } from './DesktopNav';
import { HeaderShell } from './HeaderShell';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MobileMenu } from './MobileMenu';
import { toNavServices } from './nav-services';

export async function Header() {
  const [locale, t, services] = await Promise.all([
    getLocale(),
    getTranslations(),
    getNavigationServices(),
  ]);
  const navServices = toNavServices(services, locale);

  return (
    <HeaderShell>
      <Container className="flex h-18 items-center justify-between gap-4">
        <Link href={ROUTES.HOME} aria-label={t('a11y.home')} className="rounded-md text-fg">
          <Logo />
        </Link>
        <DesktopNav services={navServices} />
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden lg:inline-flex" />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href={ROUTES.QUOTE}>{t('nav.requestQuote')}</Link>
          </Button>
          <MobileMenu services={navServices} />
        </div>
      </Container>
    </HeaderShell>
  );
}
