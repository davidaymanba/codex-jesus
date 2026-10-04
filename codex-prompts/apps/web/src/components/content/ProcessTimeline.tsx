import type { Locale } from '@codex/shared';

import { cn } from '@/lib/utils/cn';

export interface ProcessStep {
  title: string;
  description: string;
}

/**
 * Numbered steps joined by a line: a row on large screens, a column on phones. An ordered
 * list, so the sequence is announced as such.
 */
export function ProcessTimeline({
  steps,
  locale,
  className,
}: {
  steps: ProcessStep[];
  locale: Locale;
  className?: string;
}) {
  const stepNumber = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 });
  return (
    <ol
      className={cn(
        'relative grid gap-8 lg:gap-6',
        steps.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4',
        className,
      )}
    >
      {steps.map((step, index) => (
        <li key={step.title} className="relative flex gap-5 lg:flex-col">
          {index < steps.length - 1 ? (
            <span
              aria-hidden
              className="absolute start-6 top-14 bottom-[-2rem] w-px bg-border lg:start-14 lg:end-[-1.5rem] lg:top-6 lg:bottom-auto lg:h-px lg:w-auto"
            />
          ) : null}
          <span className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border border-primary bg-bg font-heading text-lg font-bold text-primary">
            {stepNumber.format(index + 1)}
          </span>
          <div className="flex flex-col gap-2">
            <h3 className="text-xl">{step.title}</h3>
            <p className="text-muted">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
