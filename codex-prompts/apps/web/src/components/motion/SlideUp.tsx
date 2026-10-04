import type { ReactNode } from 'react';

import { revealProps } from './reveal';

/** Rises and fades in as it scrolls into view (CSS only; transform + opacity). */
export function SlideUp({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div {...revealProps('rise')} className={className}>
      {children}
    </div>
  );
}
