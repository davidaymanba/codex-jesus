import { describe, expect, it } from 'vitest';

import { BRAND_COLORS as C } from '@codex/shared';

const AA_TEXT = 4.5;
const AA_UI = 3;

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((value) =>
    value <= 0.039_28 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

// Every text/background pair the surfaces and components in globals.css produce.
const TEXT_PAIRS: [string, string, string][] = [
  ['dark: text', C.white, C.navy950],
  ['dark: muted text', C.lavender200, C.navy950],
  ['dark: links', C.blue500, C.navy950],
  ['light: text', C.navy950, C.lavender50],
  ['light: muted text', C.indigo700, C.lavender50],
  ['light: links', C.blue700, C.lavender50],
  ['white: muted text', C.indigo700, C.white],
  ['white: links', C.blue700, C.white],
  ['primary button', C.navy950, C.gold500],
  ['primary button hover', C.navy950, C.gold400],
  ['secondary button', C.white, C.blue700],
  ['badge', C.navy950, C.blue100],
];

const FOCUS_RING_PAIRS: [string, string, string][] = [
  ['dark ring', C.blue500, C.navy950],
  ['light ring', C.blue700, C.lavender50],
  ['white ring', C.blue700, C.white],
];

describe('brand color pairs (WCAG AA)', () => {
  it.each(TEXT_PAIRS)('%s reaches 4.5:1', (_name, foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(FOCUS_RING_PAIRS)('%s reaches 3:1', (_name, ring, background) => {
    expect(contrast(ring, background)).toBeGreaterThanOrEqual(AA_UI);
  });

  it('explains why blue-500 is not the focus ring on light surfaces', () => {
    expect(contrast(C.blue500, C.lavender50)).toBeLessThan(AA_UI);
  });
});
