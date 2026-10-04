import type { ReactNode } from 'react';

import { revealProps } from './reveal';

/**
 * A group whose `StaggerItem` children rise in one after another (each column of a row starts
 * a little later; see `[data-reveal-group]` in globals.css).
 */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div data-reveal-group="" className={className}>
      {children}
    </div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div {...revealProps('rise')} className={className}>
      {children}
    </div>
  );
}
