import { useTranslations } from 'next-intl';

import { Counter } from '@/components/motion/Counter';
import { FadeIn } from '@/components/motion/FadeIn';
import { SlideUp } from '@/components/motion/SlideUp';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { BracketDecor } from '@/components/shared/BracketDecor';
import { GlowGradient } from '@/components/shared/GlowGradient';
import { GridPattern } from '@/components/shared/GridPattern';
import { Section, type Surface } from '@/components/shared/Section';
import { SectionHeading } from '@/components/shared/SectionHeading';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/Accordion';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

import { ShowcaseControls } from './ShowcaseControls';
import { ShowcaseOverlays } from './ShowcaseOverlays';

const STAT_VALUE = 120;

/** Every component on one surface, so dark and light can be compared side by side. */
export function ShowcaseSurface({ surface }: { surface: Surface }) {
  const t = useTranslations('showcase');
  const a11y = useTranslations('a11y');

  return (
    <Section surface={surface} aria-labelledby={`${surface}-title`} className="overflow-clip">
      <GridPattern />
      <GlowGradient className="-end-40 -top-60" />
      <h2 id={`${surface}-title`} className="mb-12 text-3xl">
        {surface === 'dark' ? t('surfaceDark') : t('surfaceLight')}
      </h2>
      <div className="grid gap-16">
        <SectionHeading
          eyebrow={t('headingEyebrow')}
          title={t('headingTitle')}
          description={t('headingDescription')}
        />
        <ShowcaseControls id={surface} />
        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          <div>
            <h3 className="mb-4 text-xl">{t('badges')}</h3>
            <div className="flex flex-wrap gap-2">
              <Badge>{t('new')}</Badge>
              <Badge variant="accent">{t('featured')}</Badge>
              <Badge variant="outline">{t('link')}</Badge>
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-xl">{t('cards')}</h3>
            <Card>
              <CardHeader>
                <CardTitle as="h4">{t('cardTitle')}</CardTitle>
                <CardDescription>{t('cardBody')}</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Badge>{t('new')}</Badge>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <h3 className="text-xl md:col-span-2">{t('disclosure')}</h3>
          <Accordion type="single" collapsible>
            <AccordionItem value="duration">
              <AccordionTrigger>{t('faqQuestion')}</AccordionTrigger>
              <AccordionContent>{t('faqAnswer')}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="startups">
              <AccordionTrigger>{t('faqQuestion2')}</AccordionTrigger>
              <AccordionContent>{t('faqAnswer2')}</AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="flex flex-col gap-6">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">{t('tabOverview')}</TabsTrigger>
                <TabsTrigger value="process">{t('tabProcess')}</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">{t('tabOverviewBody')}</TabsContent>
              <TabsContent value="process">{t('tabProcessBody')}</TabsContent>
            </Tabs>
            <ShowcaseOverlays
              labels={{
                openDialog: t('openDialog'),
                dialogTitle: t('dialogTitle'),
                dialogBody: t('dialogBody'),
                openSheet: t('openSheet'),
                showToast: t('showToast'),
                toastMessage: t('toastMessage'),
                close: a11y('close'),
              }}
            />
          </div>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-4 text-xl">{t('skeleton')}</h3>
            <div className="grid gap-3">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-xl">{t('motion')}</h3>
            <Stagger className="grid gap-3">
              <StaggerItem>
                <FadeIn>
                  <p className="font-display text-5xl text-primary">
                    <Counter value={STAT_VALUE} suffix="+" />
                  </p>
                </FadeIn>
              </StaggerItem>
              <StaggerItem>
                <SlideUp>
                  <p className="text-muted">{t('statProjects')}</p>
                </SlideUp>
              </StaggerItem>
            </Stagger>
          </div>
          <div>
            <h3 className="mb-4 text-xl">{t('decor')}</h3>
            <BracketDecor className="size-32 opacity-70" />
          </div>
        </div>
      </div>
    </Section>
  );
}
