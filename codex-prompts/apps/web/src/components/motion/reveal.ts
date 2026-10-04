/**
 * Reveal-on-scroll is pure CSS (see "Reveal on scroll" in globals.css): scroll-driven
 * animations, no JavaScript. Content is visible by default, so it never waits for a script,
 * never hides from crawlers or no-JS visitors, and browsers without scroll-driven animations
 * simply show it.
 *
 * The timeline is the nearest scroll container, and `overflow: hidden` creates one: clip
 * decorations with `overflow-clip` instead, or revealed content inside never moves.
 */
export const REVEAL_ATTRIBUTE = 'data-reveal';

export type RevealEffect = 'fade' | 'rise';

/** Attributes for an element revealed with `effect`. */
export const revealProps = (effect: RevealEffect) => ({ [REVEAL_ATTRIBUTE]: effect });
