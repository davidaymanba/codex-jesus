import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils/cn';

import { FIELD_CLASSES } from './field-styles';

export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return <input type={type} className={cn(FIELD_CLASSES, 'h-12', className)} {...props} />;
}
