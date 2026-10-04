import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import type { ClientDto } from '@codex/shared';

import { Section } from '@/components/shared/Section';
import { withFallback } from '@/lib/api/fallback';
import { getClients } from '@/lib/api/showcase';
import { cn } from '@/lib/utils/cn';

function LogoList({ clients, isCopy = false }: { clients: ClientDto[]; isCopy?: boolean }) {
  return (
    <ul
      aria-hidden={isCopy || undefined}
      className={cn('flex shrink-0 items-center gap-16 pe-16', isCopy && 'motion-reduce:hidden')}
    >
      {clients.map(({ id, name, logo }) =>
        logo ? (
          <li key={id} className="shrink-0">
            <Image
              src={logo.url}
              alt={isCopy ? '' : name}
              width={logo.width}
              height={logo.height}
              sizes="160px"
              className="h-12 w-auto opacity-75 grayscale transition hover:opacity-100 hover:grayscale-0"
            />
          </li>
        ) : null,
      )}
    </ul>
  );
}

/**
 * Home section 2: client logos on a slow CSS-only loop (no JavaScript), paused on hover. With
 * reduced motion the duplicate is hidden and the logos simply wrap.
 */
export async function ClientsMarquee() {
  const [t, clients] = await Promise.all([
    getTranslations('home.clients'),
    withFallback('home-clients', getClients, []),
  ]);
  const withLogos = clients.filter((client) => client.logo);
  if (withLogos.length === 0) return null;

  return (
    <Section surface="white" className="py-12 md:py-16">
      <h2 className="text-center font-sans text-sm font-medium tracking-wide text-muted uppercase">
        {t('title')}
      </h2>
      <div className="group mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none motion-reduce:justify-center">
          <LogoList clients={withLogos} />
          <LogoList clients={withLogos} isCopy />
        </div>
      </div>
    </Section>
  );
}
