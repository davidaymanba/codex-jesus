import { cn } from '@/lib/utils/cn';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** The page's own title is an h1; section titles are h2. */
  as?: 'h1' | 'h2';
  align?: 'start' | 'center';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  as: Heading = 'h2',
  align = 'start',
  className,
}: SectionHeadingProps) {
  return (
    <header
      className={cn(
        'flex max-w-(--container-prose) flex-col gap-4',
        align === 'center' && 'mx-auto items-center text-center',
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-sm font-medium tracking-wide text-primary uppercase">{eyebrow}</p>
      ) : null}
      <Heading className={Heading === 'h1' ? 'text-5xl' : 'text-4xl'}>{title}</Heading>
      {description ? <p className="text-lg text-muted">{description}</p> : null}
    </header>
  );
}
