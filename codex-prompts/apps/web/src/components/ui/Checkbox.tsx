'use client';

import { Check } from 'lucide-react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils/cn';

export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'peer flex size-5 shrink-0 items-center justify-center rounded-sm border border-muted bg-card transition-colors disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-2 aria-invalid:border-fg data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-bg',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check aria-hidden className="size-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
