import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

import { BracketDecor } from '@/components/shared/BracketDecor';
import { Section } from '@/components/shared/Section';
import { Button } from '@/components/ui/Button';

import { CmsLink } from './CmsLink';

interface CtaAction {
  label: string;
  /** Site path or absolute URL. */
  href: string;
}

interface CtaBannerProps {
  title: string;
  description: string;
  primary: CtaAction;
  secondary?: CtaAction | undefined;
  /** Extra content under the buttons (e.g. direct contact shortcuts). */
  children?: ReactNode;
}

/** The closing call to action of a page (dark, with the gold accent reserved for CTAs). */
export function CtaBanner({ title, description, primary, secondary, children }: CtaBannerProps) {
  return (
    <Section surface="dark" className="overflow-clip">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-14 text-center md:px-16 md:py-20">
        <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-accent" />
        <BracketDecor className="absolute -start-6 -bottom-8 size-44 text-accent opacity-20" />
        <BracketDecor className="absolute -end-6 -top-8 size-44 opacity-20" />
        <h2 className="mx-auto max-w-3xl text-4xl">{title}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">{description}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <CmsLink href={primary.href}>
              {primary.label}
              <ArrowRight aria-hidden className="rtl-flip" />
            </CmsLink>
          </Button>
          {secondary ? (
            <Button asChild size="lg" variant="outline">
              <CmsLink href={secondary.href}>{secondary.label}</CmsLink>
            </Button>
          ) : null}
        </div>
        {children}
      </div>
    </Section>
  );
}
