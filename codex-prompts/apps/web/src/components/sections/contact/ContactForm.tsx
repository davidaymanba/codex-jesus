'use client';

import { CircleCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useForm, type FieldPath } from 'react-hook-form';
import type { z } from 'zod';

import { FormAlert } from '@/components/forms/FormAlert';
import { Honeypot } from '@/components/forms/Honeypot';
import { TurnstileWidget } from '@/components/forms/TurnstileWidget';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { toErrorKey } from '@/lib/forms/error-keys';
import { lazyResolver } from '@/lib/forms/lazy-resolver';
import { usePublicForm } from '@/lib/forms/use-public-form';

import type { contactFieldsSchema } from './contact-validation';

type ContactValues = z.input<typeof contactFieldsSchema>;
type ContactOutput = z.output<typeof contactFieldsSchema>;

const validation = lazyResolver<ContactValues, ContactOutput>(
  async () => (await import('./contact-validation')).contactResolver,
);

const EMPTY = { name: '', email: '', phone: '', message: '' } satisfies ContactValues;
const FIELDS = new Set<string>(Object.keys(EMPTY));

interface ContactFormProps {
  apiUrl: string;
  turnstileSiteKey: string;
}

/**
 * The contact form: validated in the browser with the shared schema (localized messages),
 * then by the API; honeypot + Turnstile; loading, success, failure-with-retry and rate-limit
 * states; one submission at a time.
 */
export function ContactForm({ apiUrl, turnstileSiteKey }: ContactFormProps) {
  const t = useTranslations('contact.form');
  const tForms = useTranslations('forms');
  const locale = useLocale();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const { formRef, turnstileRef, token, setToken, isSending, formError, send } = usePublicForm(
    apiUrl,
    '/public/contact',
  );
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues, unknown, ContactOutput>({
    resolver: validation.resolver,
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (sentTo) successRef.current?.focus();
  }, [sentTo]);

  // Fetch the validation code as soon as the visitor starts on the form.
  useEffect(() => {
    const form = formRef.current;
    form?.addEventListener('focusin', validation.preload, { once: true });
    return () => form?.removeEventListener('focusin', validation.preload);
  }, [formRef, sentTo]);

  const onSubmit = handleSubmit(async (values) => {
    await send(
      { ...values, locale },
      {
        onInvalid: (issues) => {
          for (const { path, message } of issues) {
            if (FIELDS.has(path))
              setError(path as FieldPath<ContactValues>, { message }, { shouldFocus: true });
          }
        },
        onSuccess: () => {
          setSentTo(values.email);
          reset(EMPTY);
        },
        retry: () => void onSubmit(),
      },
    );
  });

  if (sentTo) {
    return (
      <div role="status" className="flex flex-col items-start gap-4 py-6">
        <CircleCheck aria-hidden className="size-10 text-primary" />
        <h2 ref={successRef} tabIndex={-1} className="text-3xl outline-none">
          {t('successTitle')}
        </h2>
        <p className="text-muted">{t('successBody', { email: sentTo })}</p>
        <Button
          variant="outline"
          onClick={() => {
            setSentTo(null);
          }}
        >
          {t('another')}
        </Button>
      </div>
    );
  }

  const errorCount = Object.keys(errors).length;
  return (
    <form
      ref={formRef}
      onSubmit={(event) => void onSubmit(event)}
      noValidate
      className="relative flex flex-col gap-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="contact-name" label={t('name')} error={toErrorKey(errors.name?.message)}>
          {(control) => <Input {...control} {...register('name')} autoComplete="name" />}
        </FormField>
        <FormField id="contact-email" label={t('email')} error={toErrorKey(errors.email?.message)}>
          {(control) => (
            <Input
              {...control}
              {...register('email')}
              type="email"
              autoComplete="email"
              dir="ltr"
            />
          )}
        </FormField>
      </div>
      <FormField
        id="contact-phone"
        label={`${t('phone')} (${tForms('optional')})`}
        hint={t('phoneHint')}
        error={toErrorKey(errors.phone?.message)}
      >
        {(control) => (
          <Input {...control} {...register('phone')} type="tel" autoComplete="tel" dir="ltr" />
        )}
      </FormField>
      <FormField
        id="contact-message"
        label={t('message')}
        hint={t('messageHint')}
        error={toErrorKey(errors.message?.message)}
      >
        {(control) => <Textarea {...control} {...register('message')} rows={6} />}
      </FormField>
      <Honeypot id="contact-website" />
      <TurnstileWidget
        ref={turnstileRef}
        triggerRef={formRef}
        siteKey={turnstileSiteKey}
        locale={locale}
        onToken={setToken}
        failedLabel={tForms('turnstileFailed')}
      />
      <p aria-live="polite" className="sr-only">
        {errorCount > 0 ? tForms('fixErrors', { count: errorCount }) : ''}
      </p>
      <FormAlert message={formError} />
      <Button
        type="submit"
        size="lg"
        isLoading={isSending || isSubmitting}
        disabled={!token}
        className="w-full sm:w-fit"
      >
        {isSending ? t('sending') : token ? t('submit') : tForms('verifying')}
      </Button>
    </form>
  );
}
