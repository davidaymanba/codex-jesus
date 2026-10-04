import { getTranslations } from 'next-intl/server';

import { OfferingIcon } from '@/components/content/OfferingIcon';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { Section } from '@/components/shared/Section';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Button } from '@/components/ui/Button';
import { OFFERINGS_BY_PILLAR } from '@/lib/content/offerings';
import { Link } from '@/lib/i18n/navigation';
import { quoteRoute } from '@/lib/routes';

/** Home section 4: what the development team builds, one card per solution. */
export async function ExpertiseSection() {
  const t = await getTranslations();
  return (
    <Section surface="dark">
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <SectionHeading
          eyebrow={t('home.expertise.eyebrow')}
          title={t('home.expertise.title')}
          description={t('home.expertise.description')}
        />
        <Button asChild variant="outline" className="shrink-0">
          <Link href={quoteRoute()}>{t('home.expertise.cta')}</Link>
        </Button>
      </div>
      <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {OFFERINGS_BY_PILLAR.DEVELOPMENT.map((offering) => (
          <StaggerItem key={offering}>
            <div className="flex h-full gap-4 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary">
              <OfferingIcon offering={offering} className="mt-1 size-6 shrink-0 text-primary" />
              <div className="flex flex-col gap-1.5">
                <h3 className="text-lg">{t(`offerings.${offering}.title`)}</h3>
                <p className="text-sm text-muted">{t(`offerings.${offering}.description`)}</p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
