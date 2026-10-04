import { Compass, Telescope } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { FadeIn } from '@/components/motion/FadeIn';
import { Section } from '@/components/shared/Section';

/** Mission and vision, side by side. */
export async function MissionVision() {
  const t = await getTranslations('about.missionVision');
  const blocks = [
    { key: 'mission', icon: Compass, title: t('missionTitle'), body: t('mission') },
    { key: 'vision', icon: Telescope, title: t('visionTitle'), body: t('vision') },
  ];
  return (
    <Section surface="dark">
      <p className="text-sm font-medium tracking-wide text-primary uppercase">{t('eyebrow')}</p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {blocks.map(({ key, icon: Icon, title, body }) => (
          <FadeIn key={key}>
            <article className="flex h-full flex-col gap-5 rounded-3xl border border-border bg-card p-8 md:p-10">
              <Icon aria-hidden className="size-9 text-accent" />
              <h2 className="text-3xl">{title}</h2>
              <p className="text-xl text-muted">{body}</p>
            </article>
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}
