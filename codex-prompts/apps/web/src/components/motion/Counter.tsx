'use client';

import { useLocale } from 'next-intl';
import { useEffect, useMemo, useRef } from 'react';

const DURATION_MS = 1600;
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

const isOnScreen = (element: Element) => {
  const { top, bottom } = element.getBoundingClientRect();
  return bottom > 0 && top < window.innerHeight;
};

/** Ease-out cubic: fast start, gentle landing. */
const easeOut = (progress: number) => 1 - (1 - progress) ** 3;

interface CounterProps {
  value: number;
  suffix?: string | undefined;
  className?: string;
}

/**
 * A number that counts up once when it scrolls into view. The server renders the final value
 * (crawlers, no-JS and reduced motion see it as is), so a counter already on screen at load
 * keeps it instead of dropping to 0; digits follow the locale's format. A few lines of
 * requestAnimationFrame, so no animation library ships for it.
 */
export function Counter({ value, suffix = '', className }: CounterProps) {
  const locale = useLocale();
  const ref = useRef<HTMLSpanElement>(null);
  const formatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia(REDUCED_MOTION).matches || isOnScreen(element)) return;
    let frame = 0;
    const render = (current: number) => {
      element.textContent = `${formatter.format(current)}${suffix}`;
    };
    const countUp = (start: number) => (now: number) => {
      const progress = Math.min((now - start) / DURATION_MS, 1);
      render(Math.round(value * easeOut(progress)));
      if (progress < 1) frame = requestAnimationFrame(countUp(start));
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      render(0);
      frame = requestAnimationFrame(countUp(performance.now()));
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      render(value);
    };
  }, [formatter, suffix, value]);

  return (
    <span ref={ref} className={className}>
      {formatter.format(value)}
      {suffix}
    </span>
  );
}
