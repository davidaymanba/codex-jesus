import { getTranslations } from 'next-intl/server';

import type { Locale, ProjectDto } from '@codex/shared';

import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/i18n/format';

/** Client, industry, services, tech stack and launch date as a description list. */
export async function ProjectMeta({ project, locale }: { project: ProjectDto; locale: Locale }) {
  const t = await getTranslations();
  const rows = [
    ...(project.client ? [{ label: t('portfolio.detail.client'), value: project.client }] : []),
    { label: t('portfolio.detail.industry'), value: project.industry[locale] },
    {
      label: t('portfolio.detail.services'),
      value: new Intl.ListFormat(locale, { type: 'unit' }).format([
        t(`serviceCategories.${project.serviceCategory}`),
        ...project.categories.map(({ name }) => name[locale]),
      ]),
    },
    ...(project.publishedAt
      ? [{ label: t('portfolio.detail.published'), value: formatDate(project.publishedAt, locale) }]
      : []),
  ];

  return (
    <dl className="grid gap-6 rounded-3xl border border-border bg-card p-8 sm:grid-cols-2 lg:grid-cols-4">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex flex-col gap-1">
          <dt className="text-sm text-muted">{label}</dt>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
      {project.techStack.length > 0 ? (
        <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-4">
          <dt className="text-sm text-muted">{t('portfolio.detail.techStack')}</dt>
          <dd className="flex flex-wrap gap-2">
            {project.techStack.map((tech) => (
              <Badge key={tech} variant="outline" dir="ltr">
                {tech}
              </Badge>
            ))}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
