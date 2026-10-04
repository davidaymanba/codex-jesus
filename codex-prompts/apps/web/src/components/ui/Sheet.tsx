'use client';

import { X } from 'lucide-react';
import { Dialog as SheetPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils/cn';

import { DialogOverlay } from './Dialog';

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;
export const SheetTitle = SheetPrimitive.Title;
export const SheetDescription = SheetPrimitive.Description;

interface SheetContentProps extends ComponentProps<typeof SheetPrimitive.Content> {
  /** Accessible name of the close button (translated by the caller). */
  closeLabel: string;
}

/** A dialog sliding in from the inline-end edge (right in LTR, left in RTL). */
export function SheetContent({ className, children, closeLabel, ...props }: SheetContentProps) {
  return (
    <SheetPrimitive.Portal>
      <DialogOverlay />
      <SheetPrimitive.Content
        className={cn(
          'surface-dark fixed inset-y-0 end-0 z-50 flex w-[min(22rem,100%)] flex-col gap-6 border-s border-border p-6 shadow-lg data-[state=closed]:animate-slide-out data-[state=open]:animate-slide-in',
          className,
        )}
        {...props}
      >
        <SheetPrimitive.Close
          aria-label={closeLabel}
          className="self-end rounded-full p-2 text-muted transition-colors hover:text-fg"
        >
          <X aria-hidden className="size-6" />
        </SheetPrimitive.Close>
        {children}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}
