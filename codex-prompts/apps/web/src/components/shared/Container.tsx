import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils/cn';

/** Centers content at the site's max width with fluid side padding. */
export function Container({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('container-content', className)} {...props} />;
}
