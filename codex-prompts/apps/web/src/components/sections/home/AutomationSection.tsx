import { ArrowRight, CircleCheck } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';

import { FadeIn } from '@/components/motion/FadeIn';
import { BracketDecor } from '@/components/shared/BracketDecor';
import { GlowGradient } from '@/components/shared/GlowGradient';
import { Section } from '@/components/shared/Section';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Link } from '@/lib/i18n/navigation';
import { quoteRoute } from '@/lib/routes';

import { WorkflowDiagram } from './WorkflowDiagram';

const POINTS = ['agents', 'workflows', 'control'] as const;

/** Home section 5: the AI agents and n8n automation highlight, with a live workflow diagram. */
export async function AutomationSection() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('home.automation')]);
  return (
    <Section surface="dark" className="overflow-clip border-y border-border">
      <GlowGradient className="-end-48 top-0" />
      <BracketDecor className="absolute end-6 bottom-6 hidden size-32 xl:block" />
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <div className="flex flex-col gap-8">
          <SectionHeading
            eyebrow={t('eyebrow')}
            title={t('title')}
            description={t('description')}
          />
          <ul className="flex flex-col gap-4">
            {POINTS.map((point) => (
              <li key={point} className="flex gap-3">
                <CircleCheck aria-hidden className="mt-1 size-5 shrink-0 text-accent" />
                <span>{t(`points.${point}`)}</span>
              </li>
            ))}
          </ul>
          <Button asChild className="w-fit">
            <Link href={quoteRoute('AI_AGENTS')}>
              {t('cta')}
              <ArrowRight aria-hidden className="rtl-flip" />
            </Link>
          </Button>
        </div>
        <FadeIn className="rounded-3xl border border-border bg-card/60 p-4 sm:p-8">
          <WorkflowDiagram
            locale={locale}
            label={t('diagramLabel')}
            nodeLabels={{
              trigger: t('nodes.trigger'),
              agent: t('nodes.agent'),
              crm: t('nodes.crm'),
              notify: t('nodes.notify'),
            }}
          />
        </FadeIn>
      </div>
    </Section>
  );
}
