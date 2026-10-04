import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils/cn';

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('rounded-2xl border border-border bg-card p-6 text-fg shadow-sm', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mb-4 flex flex-col gap-2', className)} {...props} />;
}

interface CardTitleProps extends ComponentProps<'h3'> {
  /** Heading level that fits the surrounding outline. */
  as?: 'h2' | 'h3' | 'h4';
}

export function CardTitle({ className, as: Heading = 'h3', ...props }: CardTitleProps) {
  return <Heading className={cn('text-xl', className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-muted', className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('text-base', className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mt-6 flex items-center gap-3', className)} {...props} />;
}
