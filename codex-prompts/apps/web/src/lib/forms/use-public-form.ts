'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { HONEYPOT_FIELD } from '@codex/shared/constants';

import type { TurnstileHandle } from '@/components/forms/TurnstileWidget';

import { submitForm, type FieldIssue, type SubmitResult } from './submit-form';

const SECONDS_PER_MINUTE = 60;

interface SendOptions {
  /** Field errors from the API (already i18n keys). */
  onInvalid: (issues: FieldIssue[]) => void;
  onSuccess: () => void;
  /** Re-runs the submission (the toast's retry action). */
  retry: () => void;
}

/**
 * The plumbing shared by the public forms: the Turnstile token (single use, renewed after
 * every attempt), the honeypot value, the API call and what each failure shows. One request
 * at a time: `isSending` disables the submit button.
 */
export function usePublicForm(apiUrl: string, path: '/public/contact' | '/public/quote') {
  const t = useTranslations('forms');
  const tErrors = useTranslations('errors');
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  // State lags a render behind: a double click would pass an `isSending` check twice.
  const inFlightRef = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);

  const messageFor = (result: Exclude<SubmitResult, { kind: 'success' | 'invalid' }>) => {
    switch (result.kind) {
      case 'rate-limited':
        return t('rateLimited', {
          minutes: Math.ceil(result.retryAfterSeconds / SECONDS_PER_MINUTE),
        });
      case 'bot-check-failed':
        return tErrors('botCheckFailed');
      case 'failed':
        return t('failed');
    }
  };

  const send = async (values: Record<string, unknown>, options: SendOptions) => {
    if (inFlightRef.current || !token) return;
    inFlightRef.current = true;
    setIsSending(true);
    setFormError(null);
    const honeypot = formRef.current ? new FormData(formRef.current).get(HONEYPOT_FIELD) : null;
    const result = await submitForm(apiUrl, path, {
      ...values,
      ...(typeof honeypot === 'string' && honeypot !== '' && { [HONEYPOT_FIELD]: honeypot }),
      turnstileToken: token,
    });
    turnstileRef.current?.reset();
    inFlightRef.current = false;
    setIsSending(false);

    if (result.kind === 'success') {
      options.onSuccess();
      return;
    }
    if (result.kind === 'invalid') {
      options.onInvalid(result.issues);
      return;
    }
    const message = messageFor(result);
    setFormError(message);
    if (result.kind === 'failed') {
      toast.error(message, { action: { label: t('retry'), onClick: options.retry } });
    }
  };

  return { formRef, turnstileRef, token, setToken, isSending, formError, send };
}
