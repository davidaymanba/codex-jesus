import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils/cn';

/** Placeholder block while content loads; hidden from assistive tech. */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-lg bg-fg/10 motion-reduce:animate-none', className)}
      {...props}
    />
  );
}
