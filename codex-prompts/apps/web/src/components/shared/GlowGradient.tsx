import { cn } from '@/lib/utils/cn';

/** A soft brand-blue glow behind hero content (pure CSS). */
export function GlowGradient({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute -z-10 size-[36rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-blue-700)_55%,transparent)_0%,transparent_65%)] blur-3xl',
        className,
      )}
    />
  );
}
