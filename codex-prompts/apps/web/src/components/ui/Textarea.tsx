import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils/cn';

import { FIELD_CLASSES } from './field-styles';

export function Textarea({ className, rows = 5, ...props }: ComponentProps<'textarea'>) {
  return <textarea rows={rows} className={cn(FIELD_CLASSES, 'py-3', className)} {...props} />;
}
