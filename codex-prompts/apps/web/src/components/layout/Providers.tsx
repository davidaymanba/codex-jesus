'use client';

import { Direction } from 'radix-ui';
import type { ReactNode } from 'react';

import { AlternatePathsProvider } from './AlternatePaths';

/**
 * Client-side context for the whole site: reading direction for Radix and localized paths. Toasts are mounted only where used (forms), keeping sonner out of every page.
 */
export function Providers({ dir, children }: { dir: 'rtl' | 'ltr'; children: ReactNode }) {
  return (
    <Direction.Provider dir={dir}>
      <AlternatePathsProvider>{children}</AlternatePathsProvider>
    </Direction.Provider>
  );
}
