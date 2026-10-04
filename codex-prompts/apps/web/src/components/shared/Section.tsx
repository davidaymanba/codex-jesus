import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils/cn';

import { Container } from './Container';

export type Surface = 'dark' | 'light' | 'white';

const SURFACE_CLASSES: Record<Surface, string> = {
  dark: 'surface-dark',
  light: 'surface-light',
  white: 'surface-white',
};

interface SectionProps extends ComponentProps<'section'> {
  /** Switches every semantic color inside (dark navy or light lavender/white). */
  surface?: Surface;
  /** Skip the inner Container (full-bleed content). */
  isFullBleed?: boolean;
}

export function Section({
  surface = 'light',
  isFullBleed = false,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(SURFACE_CLASSES[surface], 'relative isolate py-16 md:py-24', className)}
      {...props}
    >
      {isFullBleed ? children : <Container>{children}</Container>}
    </section>
  );
}
