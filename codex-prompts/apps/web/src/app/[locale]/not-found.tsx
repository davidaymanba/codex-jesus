import { useTranslations } from 'next-intl';

import { BracketDecor } from '@/components/shared/BracketDecor';
import { GridPattern } from '@/components/shared/GridPattern';
import { Section } from '@/components/shared/Section';
import { Button } from '@/components/ui/Button';
import { Link } from '@/lib/i18n/navigation';
import { ROUTES } from '@/lib/routes';

export default function NotFound() {
  const t = useTranslations('notFound');
  return (
    <Section surface="dark" className="flex min-h-[70dvh] items-center overflow-clip">
      <GridPattern />
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
        <BracketDecor className="size-24 opacity-60" />
        <p className="font-display text-display text-primary" aria-hidden>
          404
        </p>
        <h1 className="text-4xl">{t('title')}</h1>
        <p className="text-lg text-muted">{t('description')}</p>
        <Button asChild size="lg">
          <Link href={ROUTES.HOME}>{t('home')}</Link>
        </Button>
      </div>
    </Section>
  );
}
