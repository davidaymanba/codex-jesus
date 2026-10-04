import { CircleAlert } from 'lucide-react';

/** A form-level problem (not tied to one field), announced as it appears. */
export function FormAlert({ message }: { message: string | null }) {
  return (
    <div role="alert" aria-live="assertive">
      {message ? (
        <p className="flex items-start gap-2 rounded-xl border border-border bg-gold-50 p-4 text-sm font-medium text-navy-950">
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {message}
        </p>
      ) : null}
    </div>
  );
}
