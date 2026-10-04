'use client';

import { useSyncExternalStore, type ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

const SCROLLED_AFTER_PX = 8;

function subscribeToScroll(onChange: () => void): () => void {
  window.addEventListener('scroll', onChange, { passive: true });
  return () => {
    window.removeEventListener('scroll', onChange);
  };
}

const isPageScrolled = () => window.scrollY > SCROLLED_AFTER_PX;
// The server renders the top-of-page state.
const isScrolledOnServer = () => false;

/** The sticky header bar; gains a blurred, bordered background once the page scrolls. */
export function HeaderShell({ children }: { children: ReactNode }) {
  const isScrolled = useSyncExternalStore(subscribeToScroll, isPageScrolled, isScrolledOnServer);

  return (
    <header
      className={cn(
        'surface-dark sticky top-0 z-40 border-b transition-[background-color,border-color] duration-300',
        isScrolled ? 'border-border bg-bg/80 backdrop-blur-md' : 'border-transparent',
      )}
    >
      {children}
    </header>
  );
}
