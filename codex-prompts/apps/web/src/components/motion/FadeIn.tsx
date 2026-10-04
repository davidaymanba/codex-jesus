import type { ReactNode } from 'react';

import { revealProps } from './reveal';

/** Fades content in as it scrolls into view (CSS only; opacity only). */
export function FadeIn({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div {...revealProps('fade')} className={className}>
      {children}
    </div>
  );
}
