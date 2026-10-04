import { Eye, Handshake, Target, Users, type LucideIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { Section, type Surface } from '@/components/shared/Section';
import { SectionHeading } from '@/components/shared/SectionHeading';

const REASONS = [
  { key: 'oneTeam', icon: Users },
  { key: 'results', icon: Target },
  { key: 'transparent', icon: Eye },
  { key: 'partner', icon: Handshake },
] as const satisfies readonly { key: string; icon: LucideIcon }[];

/** "Why Codex": four reasons, on the Services and About pages. */
export async function WhyCodexSection({ surface = 'dark' }: { surface?: Surface }) {
  const t = await getTranslations('whyCodex');
  return (
    <Section surface={surface}>
      <SectionHeading eyebrow={t('eyebrow')} title={t('title')} description={t('description')} />
      <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {REASONS.map(({ key, icon: Icon }) => (
          <StaggerItem key={key}>
            <div className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-6">
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
