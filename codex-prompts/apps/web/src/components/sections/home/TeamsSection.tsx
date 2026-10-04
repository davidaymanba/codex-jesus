import { CodeXml, Megaphone, Palette, type LucideIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Team } from '@codex/shared';

import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { Section, type Surface } from '@/components/shared/Section';
import { SectionHeading } from '@/components/shared/SectionHeading';

const TEAM_ICONS: Record<Team, LucideIcon> = {
  BRAND: Palette,
  MARKETING: Megaphone,
  DEVELOPMENT: CodeXml,
};

/** Home section 7 (also on About): the three teams and what each one does. */
export async function TeamsSection({ id, surface = 'white' }: { id?: string; surface?: Surface }) {
  const t = await getTranslations();
  return (
    <Section surface={surface} id={id}>
      <SectionHeading
        eyebrow={t('home.teams.eyebrow')}
        title={t('home.teams.title')}
        description={t('home.teams.description')}
      />
      <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
        {Object.values(Team).map((team) => {
          const Icon = TEAM_ICONS[team];
          return (
            <StaggerItem key={team}>
              <article className="flex h-full flex-col gap-4 rounded-3xl border border-border bg-card p-8">
                <Icon aria-hidden className="size-8 text-primary" />
                <h3 className="text-2xl">{t(`teams.${team}.name`)}</h3>
                <p className="text-muted">{t(`teams.${team}.description`)}</p>
                <p className="mt-auto border-t border-border pt-4 text-sm font-medium">
                  {t(`teams.${team}.focus`)}
                </p>
              </article>
            </StaggerItem>
          );
        })}
      </Stagger>
    </Section>
  );
}
