import { getLocale, getTranslations } from 'next-intl/server';

import { ProcessTimeline } from '@/components/content/ProcessTimeline';
import { Section, type Surface } from '@/components/shared/Section';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { getSiteSettings } from '@/lib/api/settings';

const DEFAULT_STEPS = ['discover', 'design', 'build', 'launch', 'grow'] as const;

/** Home section 9 (also on Services and About): the process timeline from the settings. */
export async function ProcessSection({ surface = 'light' }: { surface?: Surface }) {
  const [locale, t, settings] = await Promise.all([
    getLocale(),
    getTranslations('home.process'),
    getSiteSettings(),
  ]);
  const fromSettings = settings?.homepage.processSteps ?? [];
  const steps =
    fromSettings.length > 0
      ? fromSettings.map(({ title, description }) => ({
          title: title[locale],
          description: description[locale],
        }))
      : DEFAULT_STEPS.map((step) => ({
          title: t(`steps.${step}.title`),
          description: t(`steps.${step}.description`),
        }));

  return (
    <Section surface={surface}>
      <SectionHeading eyebrow={t('eyebrow')} title={t('title')} description={t('description')} />
      <ProcessTimeline steps={steps} locale={locale} className="mt-14" />
    </Section>
  );
}
