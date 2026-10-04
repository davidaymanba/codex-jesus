import { ArrowUpRight } from 'lucide-react';

import type { Locale, ProjectSummaryDto } from '@codex/shared';

import { Badge } from '@/components/ui/Badge';
import { Link } from '@/lib/i18n/navigation';
import { projectRoute, slugIn } from '@/lib/routes';

import { MediaImage } from './MediaImage';

const CARD_SIZES = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw';

/** A case-study card; the whole card is the link (title as its accessible name). */
export function ProjectCard({
  project,
  locale,
  headingLevel: Heading = 'h3',
  isPriority = false,
}: {
  project: ProjectSummaryDto;
  locale: Locale;
  headingLevel?: 'h2' | 'h3';
  /** First card of a listing: its cover may be the LCP image on phones. */
  isPriority?: boolean;
}) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg">
      <div className="relative aspect-[16/10] overflow-hidden bg-navy-950">
        {project.cover ? (
          <MediaImage
            media={project.cover}
            locale={locale}
            sizes={CARD_SIZES}
            isFill
            isPriority={isPriority}
            className="transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex flex-wrap gap-2">
          {project.categories.map((category) => (
            <Badge key={category.id}>{category.name[locale]}</Badge>
          ))}
        </div>
        <Heading className="text-xl">
          <Link
            href={projectRoute(slugIn(project, locale))}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {project.title[locale]}
          </Link>
        </Heading>
        <p className="mt-auto flex items-center justify-between gap-3 text-sm text-muted">
          {project.industry[locale]}
          <ArrowUpRight
            aria-hidden
            className="size-5 rtl-flip text-primary transition-transform group-hover:-translate-y-0.5"
          />
        </p>
      </div>
    </article>
  );
}
