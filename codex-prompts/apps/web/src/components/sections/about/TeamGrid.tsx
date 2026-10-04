import { getLocale, getTranslations } from 'next-intl/server';

import { Team, type Locale, type SocialPlatform, type TeamMemberDto } from '@codex/shared';

import { MediaImage } from '@/components/content/MediaImage';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { Section } from '@/components/shared/Section';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { withFallback } from '@/lib/api/fallback';
import { getTeamMembers } from '@/lib/api/showcase';

function MemberCard({
  member,
  locale,
  socialLabel,
}: {
  member: TeamMemberDto;
  locale: Locale;
  /** Visible platform name and the link's accessible name ("Sara on LinkedIn"). */
  socialLabel: (platform: SocialPlatform) => { label: string; name: string };
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative aspect-square bg-navy-950">
        {member.photo ? (
          <MediaImage
            media={member.photo}
            locale={locale}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            isFill
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-6">
        <h4 className="text-xl">{member.name[locale]}</h4>
        <p className="text-sm font-medium text-primary">{member.role[locale]}</p>
        <p className="text-sm text-muted">{member.bio[locale]}</p>
        {member.socials.length > 0 ? (
          <ul className="mt-auto flex flex-wrap gap-3 pt-3 text-sm">
            {member.socials.map(({ platform, url }) => {
              const { label, name } = socialLabel(platform);
              return (
                <li key={platform}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="font-medium underline-offset-4 hover:text-primary hover:underline"
                  >
                    {name}
                  </a>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

/** Team members from the API, grouped by team (Brand, Marketing, Development). */
export async function TeamGrid() {
  const [locale, t, members] = await Promise.all([
    getLocale(),
    getTranslations(),
    withFallback('about-team', getTeamMembers, []),
  ]);
  const groups = Object.values(Team)
    .map((team) => ({ team, members: members.filter((member) => member.team === team) }))
    .filter((group) => group.members.length > 0);

  return (
    <Section surface="light">
      <SectionHeading
        eyebrow={t('about.team.eyebrow')}
        title={t('about.team.title')}
        description={t('about.team.description')}
      />
      {groups.length === 0 ? (
        <p className="mt-10 text-muted">{t('about.team.empty')}</p>
      ) : (
        groups.map(({ team, members: teamMembers }) => (
          <section key={team} aria-labelledby={`team-${team}`} className="mt-14">
            <h3 id={`team-${team}`} className="mb-6 text-2xl">
              {t(`teams.${team}.name`)}
            </h3>
            <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {teamMembers.map((member) => (
                <StaggerItem key={member.id}>
                  <MemberCard
                    member={member}
                    locale={locale}
                    socialLabel={(platform) => {
                      const name = t(`socialPlatforms.${platform}`);
                      return {
                        name,
                        label: t('about.team.socialLink', {
                          name: member.name[locale],
                          platform: name,
                        }),
                      };
                    }}
                  />
                </StaggerItem>
              ))}
            </Stagger>
          </section>
        ))
      )}
    </Section>
  );
}
