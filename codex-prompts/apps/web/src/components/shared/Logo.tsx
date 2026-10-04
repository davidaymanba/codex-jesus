import { cn } from '@/lib/utils/cn';

interface LogoProps {
  className?: string;
  /** Accessible name; omit when a surrounding link already names it. */
  title?: string;
}

/**
 * Placeholder Codex mark until the real logo files arrive: a blocky "C" holding `{}`, then
 * the wordmark. Inline SVG in the current text color, so it fits both surfaces.
 */
export function Logo({ className, title }: LogoProps) {
  return (
    <svg
      viewBox="0 0 168 40"
      // The wordmark is Latin: without this, RTL pages anchor the text from its end.
      direction="ltr"
      className={cn('h-9 w-auto', className)}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      <path fill="currentColor" d="M4 4h32v9H13v14h23v9H4z" />
      <path
        className="fill-gold-500"
        d="M19.5 14h3v3h-1.5v2.5L19.5 21l1.5 1.5V25h1.5v3h-3l-1-1v-3l-1.5-1.5v-1L18.5 20v-3z"
      />
      <path
        className="fill-gold-500"
        d="M28.5 14h-3v3H27v2.5L28.5 21 27 22.5V25h-1.5v3h3l1-1v-3l1.5-1.5v-1L29.5 20v-3z"
      />
      <text
        x="46"
        y="29"
        fill="currentColor"
        className="font-heading"
        fontSize="26"
        fontWeight="700"
        letterSpacing="0.5"
      >
        Codex
      </text>
    </svg>
  );
}
