import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils/cn';

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-60 aria-busy:cursor-progress [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Gold is reserved for the main call to action, always with navy text.
        primary: 'bg-gold-500 text-navy-950 hover:bg-gold-400',
        // blue-700 keeps white text above AA on both surfaces (blue-500 would not).
        secondary: 'bg-blue-700 text-white hover:bg-blue-700/85',
        outline:
          'border border-border bg-transparent text-fg hover:border-primary hover:text-primary',
        ghost: 'bg-transparent text-fg hover:bg-fg/8',
        link: 'h-auto rounded-none px-0 text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-13 px-8 text-lg',
        icon: 'size-11',
      },
    },
    // A link stays text-sized whatever `size` says.
    compoundVariants: [{ variant: 'link', className: 'h-auto px-0' }],
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  /** Renders the child element (e.g. a link) with button styles instead of a <button>. */
  asChild?: boolean;
  /** Shows a spinner, disables the button and announces it as busy. */
  isLoading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  isLoading = false,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  if (asChild) {
    return (
      <Slot.Root className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }
  return (
    <button
      type={type}
      className={classes}
      // `||`, not `??`: an explicit disabled={false} must not re-enable a loading button.
      disabled={Boolean(disabled) || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? <LoaderCircle aria-hidden className="animate-spin" /> : null}
      {children}
    </button>
  );
}
