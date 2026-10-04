import { getLocale, getTranslations } from 'next-intl/server';

import { ServiceCategory } from '@codex/shared';

import { Container } from '@/components/shared/Container';
import { Logo } from '@/components/shared/Logo';
import { getNavigationServices } from '@/lib/api/services';
import { getSiteSettings } from '@/lib/api/settings';
import { Link } from '@/lib/i18n/navigation';
import { pillarRoute, ROUTES } from '@/lib/routes';

import { FooterContact } from './FooterContact';
import { FooterNewsletter } from './FooterNewsletter';
import { toNavServices } from './nav-services';

const COMPANY_LINKS = [
  { key: 'about', href: ROUTES.ABOUT },
  { key: 'portfolio', href: ROUTES.PORTFOLIO },
  { key: 'blog', href: ROUTES.BLOG },
  { key: 'contact', href: ROUTES.CONTACT },
] as const;

const headingClasses = 'mb-4 font-sans text-sm font-medium tracking-wide text-muted uppercase';
const linkClasses = 'text-fg/85 transition-colors hover:text-fg';

export async function Footer() {
  const [locale, t, settings, services] = await Promise.all([
    getLocale(),
    getTranslations(),
    getSiteSettings(),
    getNavigationServices(),
  ]);
  const navServices = toNavServices(services, locale);
  // Without published services (or the API), each pillar links to its section on /services.
  const serviceLinks =
    navServices.length > 0
      ? navServices.map(({ href, title }) => ({ href, label: title }))
      : Object.values(ServiceCategory).map((category) => ({
          href: pillarRoute(category),
          label: t(`serviceCategories.${category}`),
        }));

  return (
    <footer className="surface-dark border-t border-border pt-16 pb-8">
      <Container className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
        <div className="flex flex-col gap-4">
          <Link href={ROUTES.HOME} aria-label={t('a11y.home')} className="w-fit rounded-md">
            <Logo />
          </Link>
          <p className="max-w-xs text-muted">{t('footer.tagline')}</p>
        </div>
        <nav aria-labelledby="footer-services">
          <h2 id="footer-services" className={headingClasses}>
            {t('footer.servicesTitle')}
          </h2>
          <ul className="grid gap-3">
            {serviceLinks.map(({ href, label }) => (
              <li key={label}>
                <Link href={href} className={linkClasses}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-labelledby="footer-company">
          <h2 id="footer-company" className={headingClasses}>
            {t('footer.companyTitle')}
          </h2>
          <ul className="grid gap-3">
            {COMPANY_LINKS.map(({ key, href }) => (
              <li key={key}>
                <Link href={href} className={linkClasses}>
                  {t(`nav.${key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-8">
          {settings ? <FooterContact settings={settings} locale={locale} /> : null}
          <FooterNewsletter />
        </div>
      </Container>
      <Container className="mt-12 flex flex-col gap-4 border-t border-border pt-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        <ul className="flex gap-6">
          <li>
            <Link href={ROUTES.PRIVACY} className="hover:text-fg">
              {t('footer.privacy')}
            </Link>
          </li>
          <li>
            <Link href={ROUTES.TERMS} className="hover:text-fg">
              {t('footer.terms')}
            </Link>
          </li>
        </ul>
      </Container>
    </footer>
  );
}
