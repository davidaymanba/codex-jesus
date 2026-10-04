'use client';

import { Menu } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';

import type { NavService } from './DesktopNav';

const loadSheet = () => import('./MobileMenuSheet');
// The dialog code (Radix) loads on first interaction, not with every page.
const MobileMenuSheet = dynamic(loadSheet, { ssr: false });

/** Menu button for small screens; the sheet is fetched as soon as the user reaches for it. */
export function MobileMenu({ services }: { services: NavService[] }) {
  const a11y = useTranslations('a11y');
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const prefetch = () => {
    void loadSheet();
  };

  return (
    <>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label={a11y('openMenu')}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onPointerEnter={prefetch}
        onFocus={prefetch}
        onTouchStart={prefetch}
        onClick={() => {
          setHasOpened(true);
          setIsOpen(true);
        }}
      >
        <Menu aria-hidden className="size-6!" />
      </Button>
      {hasOpened ? (
        <MobileMenuSheet
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          services={services}
          returnFocusTo={triggerRef}
        />
      ) : null}
    </>
  );
}
