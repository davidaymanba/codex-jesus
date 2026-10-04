import { Eye, Gem, ShieldCheck, Sprout } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { Section } from '@/components/shared/Section';
import { SectionHeading } from '@/components/shared/SectionHeading';

const VALUES = [
  { key: 'clarity', icon: Eye },
  { key: 'craft', icon: Gem },
  { key: 'ownership', icon: ShieldCheck },
  { key: 'learning', icon: Sprout },
] as const;

/** The company's four values. */
export async function ValuesSection() {
  const t = await getTranslations('about.values');
  return (
    <Section surface="white">
      <SectionHeading eyebrow={t('eyebrow')} title={t('title')} />
      <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {VALUES.map(({ key, icon: Icon }) => (
          <StaggerItem key={key}>
            <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-6">
              <Icon aria-hidden className="size-7 text-primary" />
              <h3 className="text-xl">{t(`items.${key}.title`)}</h3>
              <p className="text-muted">{t(`items.${key}.description`)}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
