'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { Link } from '@/lib/i18n/navigation';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils/cn';

import type { NavService } from './DesktopNav';

interface ServicesMenuProps {
  label: string;
  allServicesLabel: string;
  services: NavService[];
  triggerClassName: string;
}

/**
 * "Services" dropdown as a disclosure (the WAI-ARIA pattern for site navigation): a button
 * that shows a list of links. Escape, a click outside or focus leaving it closes the list.
 */
export function ServicesMenu({
  label,
  allServicesLabel,
  services,
  triggerClassName,
}: ServicesMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    // A click or focus anywhere outside the menu closes it.
    const closeWhenOutside = (event: Event) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', closeWhenOutside);
    document.addEventListener('focusin', closeWhenOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeWhenOutside);
      document.removeEventListener('focusin', closeWhenOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const close = () => {
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => {
          setIsOpen((open) => !open);
        }}
        className={triggerClassName}
      >
        {label}
        <ChevronDown
          aria-hidden
          className={cn('size-4 transition-transform', isOpen && 'rotate-180')}
        />
      </button>
      <div
        id={panelId}
        hidden={!isOpen}
        className="surface-dark absolute start-0 top-full z-50 mt-2 w-md rounded-2xl border border-border p-3 shadow-lg"
      >
        <ul className="grid gap-1">
          {services.map((service) => (
            <li key={service.href}>
              <Link
                href={service.href}
                onClick={close}
                className="block rounded-xl p-3 transition-colors hover:bg-fg/8"
              >
                <span className="block font-medium">{service.title}</span>
                <span className="block text-sm text-muted">{service.description}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={ROUTES.SERVICES}
              onClick={close}
              className="block rounded-xl p-3 text-sm font-medium text-primary hover:bg-fg/8"
            >
              {allServicesLabel}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
