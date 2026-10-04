import { cn } from '@/lib/utils/cn';

/** A faint grid fading out toward the edges (pure CSS, no image request). */
export function GridPattern({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--surface-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--surface-border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)] bg-size-[3.5rem_3.5rem] opacity-40',
        className,
      )}
    />
  );
}
