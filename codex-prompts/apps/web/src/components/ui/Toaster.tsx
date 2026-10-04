'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';

/** Toast outlet; call `toast()` from `sonner` anywhere in client components. */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast: 'surface-dark !rounded-xl !border !border-border !bg-bg !text-fg !font-sans',
          description: '!text-muted',
        },
      }}
      {...props}
    />
  );
}
