'use client';

import { useTranslations } from 'next-intl';
import type { RefObject } from 'react';

import { Button } from '@/components/ui/Button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/Sheet';
import { Link } from '@/lib/i18n/navigation';
import { MAIN_NAV, ROUTES } from '@/lib/routes';

import type { NavService } from './DesktopNav';
import { LanguageSwitcher } from './LanguageSwitcher';

interface MobileMenuSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  services: NavService[];
  /** The menu button: focus goes back to it on close (it is not a Radix trigger). */
  returnFocusTo: RefObject<HTMLButtonElement | null>;
}

/** The mobile navigation sheet (focus trapped, Escape closes, focus returns to the button). */
export default function MobileMenuSheet({
  isOpen,
  onOpenChange,
  services,
  returnFocusTo,
}: MobileMenuSheetProps) {
  const t = useTranslations('nav');
  const a11y = useTranslations('a11y');
  const close = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        closeLabel={a11y('closeMenu')}
        aria-describedby={undefined}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusTo.current?.focus();
        }}
      >
        <SheetTitle className="sr-only">{a11y('mainNavigation')}</SheetTitle>
        <nav
          aria-label={a11y('mainNavigation')}
          className="flex flex-1 flex-col gap-1 overflow-y-auto"
        >
          {MAIN_NAV.map(({ key, href }) => (
            <div key={key}>
              <Link
                href={href}
                onClick={close}
                className="block rounded-xl px-3 py-3 text-lg font-medium hover:bg-fg/8"
              >
                {t(key)}
              </Link>
              {key === 'services' && services.length > 0 ? (
                <ul className="ms-3 border-s border-border ps-3">
                  {services.map((service) => (
                    <li key={service.href}>
                      <Link
                        href={service.href}
                        onClick={close}
                        className="block rounded-lg px-3 py-2 text-muted hover:text-fg"
                      >
                        {service.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </nav>
        <div className="flex flex-col gap-3 border-t border-border pt-6">
          <LanguageSwitcher className="justify-center" />
          <Button asChild size="lg">
            <Link href={ROUTES.QUOTE} onClick={close}>
              {t('requestQuote')}
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
