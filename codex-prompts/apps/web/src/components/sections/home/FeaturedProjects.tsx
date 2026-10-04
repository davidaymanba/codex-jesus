import { ArrowRight } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';

import { ProjectCard } from '@/components/content/ProjectCard';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { Section } from '@/components/shared/Section';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Button } from '@/components/ui/Button';
import { withFallback } from '@/lib/api/fallback';
import { getProjects } from '@/lib/api/projects';
import { Link } from '@/lib/i18n/navigation';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils/cn';

const FEATURED_LIMIT = 6;

/** Home section 8: featured case studies (projects flagged as featured in the admin). */
export async function FeaturedProjects() {
  const [locale, t, projects] = await Promise.all([
    getLocale(),
    getTranslations('home.featured'),
    withFallback(
      'home-featured-projects',
      async () => (await getProjects({ isFeatured: true, pageSize: FEATURED_LIMIT })).data,
      [],
    ),
  ]);
  if (projects.length === 0) return null;

  return (
    <Section surface="dark">
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} description={t('description')} />
        <Button asChild variant="outline" className="shrink-0">
          <Link href={ROUTES.PORTFOLIO}>
            {t('viewAll')}
            <ArrowRight aria-hidden className="rtl-flip" />
          </Link>
        </Button>
      </div>
      {/* Four cards read better as a 2×2 grid than as a row of three plus one. */}
      <Stagger
        className={cn(
          'mt-12 grid gap-6 sm:grid-cols-2',
          projects.length % 3 === 1 ? 'xl:grid-cols-2' : 'lg:grid-cols-3',
        )}
      >
        {projects.map((project) => (
          <StaggerItem key={project.id}>
            <ProjectCard project={project} locale={locale} />
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
