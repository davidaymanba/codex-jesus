import { getTranslations } from 'next-intl/server';

import { Section } from '@/components/shared/Section';
import { SectionHeading } from '@/components/shared/SectionHeading';

const PARAGRAPHS = ['first', 'second', 'third'] as const;

/** The company story (placeholder copy in the message files until the real one is ready). */
export async function StorySection() {
  const t = await getTranslations('about.story');
  return (
    <Section surface="light">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} />
        <div className="flex flex-col gap-5 text-lg">
          {PARAGRAPHS.map((key) => (
            <p key={key}>{t(`paragraphs.${key}`)}</p>
          ))}
        </div>
      </div>
    </Section>
  );
}
