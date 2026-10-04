import { cn } from '@/lib/utils/cn';

/** The brand's `{ }` motif as a quiet background ornament (decorative only). */
export function BracketDecor({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 120 120"
      className={cn('pointer-events-none text-primary opacity-15 select-none', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="square"
    >
      <path d="M45 15H35v30l-12 15 12 15v30h10" />
      <path d="M75 15h10v30l12 15-12 15v30H75" />
    </svg>
  );
}
