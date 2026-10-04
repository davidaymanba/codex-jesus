import { CircleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import type { ERROR_MESSAGES, VALIDATION_MESSAGES } from '@codex/shared';

import { cn } from '@/lib/utils/cn';

import { Label } from './Label';

/** An i18n key the API (or a shared zod schema) puts in `error.details[].message`. */
export type FieldErrorKey =
  | (typeof VALIDATION_MESSAGES)[keyof typeof VALIDATION_MESSAGES]
  | (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];

/** Props to spread on the control so it is labelled and described for assistive tech. */
export interface FieldControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
}

interface FormFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: FieldErrorKey | undefined;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

/** Label, control, hint and translated error message, wired together with ARIA. */
export function FormField({ id, label, hint, error, className, children }: FormFieldProps) {
  const t = useTranslations();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        ...(describedBy && { 'aria-describedby': describedBy }),
        ...(error && { 'aria-invalid': true }),
      })}
      {hint ? (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-sm font-medium">
          <CircleAlert aria-hidden className="size-4 shrink-0" />
          {t(error)}
        </p>
      ) : null}
    </div>
  );
}
