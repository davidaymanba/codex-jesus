'use client';

import { RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Section } from '@/components/shared/Section';
import { Button } from '@/components/ui/Button';
import { Link } from '@/lib/i18n/navigation';
import { ROUTES } from '@/lib/routes';

// Next.js also passes `error`; the page shows no details (the server logged it).
interface ErrorPageProps {
  retry: () => void;
}

/** Localized error boundary for every page; the server already logged the error. */
export default function ErrorPage({ retry }: ErrorPageProps) {
  const t = useTranslations('error');
  return (
    <Section surface="dark" className="flex min-h-[70dvh] items-center">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
        <h1 className="text-4xl">{t('title')}</h1>
        <p className="text-lg text-muted">{t('description')}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            size="lg"
            onClick={() => {
              retry();
            }}
          >
            <RotateCcw aria-hidden />
            {t('retry')}
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={ROUTES.HOME}>{t('home')}</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
