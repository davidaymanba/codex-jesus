import { cn } from '@/lib/utils/cn';

/** Indent (in steps) and segments (width in rem, color) of each decorative code line. */
const LINES: [number, [number, string][]][] = [
  [
    0,
    [
      [3, 'bg-blue-300'],
      [5, 'bg-lavender-200/40'],
    ],
  ],
  [
    1,
    [
      [2.5, 'bg-gold-200'],
      [6, 'bg-blue-500/70'],
    ],
  ],
  [
    2,
    [
      [4, 'bg-lavender-200/40'],
      [3, 'bg-blue-300'],
    ],
  ],
  [2, [[7, 'bg-blue-500/70']]],
  [
    1,
    [
      [2, 'bg-gold-200'],
      [4.5, 'bg-lavender-200/40'],
    ],
  ],
  [
    2,
    [
      [5.5, 'bg-blue-300'],
      [2.5, 'bg-lavender-200/40'],
    ],
  ],
  [0, [[1.5, 'bg-blue-300']]],
];

/**
 * The hero's code-inspired illustration: an editor window drawn with CSS (no image request,
 * nothing for the LCP to wait on). Purely decorative.
 */
export function CodeVisual({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('relative', className)} dir="ltr">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-blue-700/25 blur-3xl" />
      <div className="rounded-2xl border border-border bg-card/80 shadow-glow backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <span className="size-3 rounded-full bg-gold-500" />
          <span className="size-3 rounded-full bg-blue-300" />
          <span className="size-3 rounded-full bg-lavender-200/50" />
          <span className="ms-4 h-2.5 w-24 rounded-full bg-lavender-200/25" />
        </div>
        <div className="flex flex-col gap-4 p-6 sm:p-8">
          {LINES.map(([indent, segments], line) => (
            <div
              // Static decoration: the position is the identity.
              // eslint-disable-next-line @eslint-react/no-array-index-key
              key={line}
              className="flex items-center gap-3"
              style={{ paddingInlineStart: `${String(indent * 1.5)}rem` }}
            >
              <span className="w-5 text-end font-mono text-xs text-lavender-200/40">
                {line + 1}
              </span>
              {segments.map(([width, color], segment) => (
                <span
                  // eslint-disable-next-line @eslint-react/no-array-index-key
                  key={segment}
                  className={cn('h-2.5 rounded-full', color)}
                  style={{ width: `${String(width)}rem` }}
                />
              ))}
            </div>
          ))}
          <span className="ms-8 h-5 w-0.5 animate-caret bg-gold-500" />
        </div>
      </div>
      <div className="absolute -end-4 -bottom-6 flex size-20 items-center justify-center rounded-2xl bg-accent font-display text-3xl text-accent-fg shadow-lg sm:-end-8">
        {'{ }'}
      </div>
    </div>
  );
}
