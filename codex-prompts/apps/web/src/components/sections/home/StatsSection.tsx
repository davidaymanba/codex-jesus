import { getLocale, getTranslations } from 'next-intl/server';

import { Counter } from '@/components/motion/Counter';
import { Section, type Surface } from '@/components/shared/Section';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { getSiteSettings } from '@/lib/api/settings';

/** Home section 6 (also on About): the company's numbers from the settings, counting up. */
export async function StatsSection({ surface = 'light' }: { surface?: Surface }) {
  const [locale, t, settings] = await Promise.all([
    getLocale(),
    getTranslations('home.stats'),
    getSiteSettings(),
  ]);
  const stats = settings?.homepage.stats ?? [];
  if (stats.length === 0) return null;

  return (
    <Section surface={surface}>
      <SectionHeading eyebrow={t('eyebrow')} title={t('title')} align="center" />
      <dl className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label.en}
            className="flex flex-col-reverse items-center gap-2 rounded-2xl border border-border bg-card px-4 py-8 text-center"
          >
            <dt className="text-muted">{stat.label[locale]}</dt>
            <dd className="font-display text-5xl text-primary tabular-nums">
              <Counter value={stat.value} suffix={stat.suffix} />
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
