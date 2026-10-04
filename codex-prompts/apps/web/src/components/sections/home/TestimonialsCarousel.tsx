'use client';

import { ChevronLeft, ChevronRight, Pause, Play, Quote, Star } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/components/motion/use-prefers-reduced-motion';

const ROTATE_EVERY_MS = 7000;

export interface TestimonialSlide {
  id: string;
  quote: string;
  name: string;
  role: string;
  rating: number;
}

interface CarouselLabels {
  region: string;
  previous: string;
  next: string;
  pause: string;
  play: string;
  /** Per slide: "2 of 4". */
  slide: string[];
  rating: string[];
}

const controlClasses =
  'inline-flex size-11 items-center justify-center rounded-full border border-border transition-colors hover:border-primary hover:text-primary';

/**
 * Accessible testimonial slider (WAI-ARIA carousel pattern): native scroll-snap for swipe and
 * keyboard scrolling, previous / next buttons, and auto-rotation with a pause button. Rotation
 * stops while the pointer or focus is inside, and never starts with reduced motion.
 */
export function TestimonialsCarousel({
  slides,
  labels,
}: {
  slides: TestimonialSlide[];
  labels: CarouselLabels;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  // `null` until hydrated: no rotation (and the server's markup) before that.
  const prefersReducedMotion = usePrefersReducedMotion();
  const [choice, setChoice] = useState<'auto' | 'paused' | 'playing'>('auto');
  const [isInteracting, setIsInteracting] = useState(false);
  const isPlaying = choice === 'playing' || (choice === 'auto' && prefersReducedMotion === false);

  // Hover and focus only pause the rotation; they are not interactions of the region itself.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const pause = () => {
      setIsInteracting(true);
    };
    const resume = (event: Event) => {
      const next = event instanceof FocusEvent ? event.relatedTarget : null;
      if (!(next instanceof Node && root.contains(next))) setIsInteracting(false);
    };
    root.addEventListener('pointerenter', pause);
    root.addEventListener('pointerleave', resume);
    root.addEventListener('focusin', pause);
    root.addEventListener('focusout', resume);
    return () => {
      root.removeEventListener('pointerenter', pause);
      root.removeEventListener('pointerleave', resume);
      root.removeEventListener('focusin', pause);
      root.removeEventListener('focusout', resume);
    };
  }, []);

  const scrollBySlide = useCallback((step: 1 | -1) => {
    const viewport = viewportRef.current;
    const slide = viewport?.firstElementChild;
    if (!viewport || !(slide instanceof HTMLElement)) return;
    // scrollLeft runs negative in RTL, so "forward" is to the left there.
    const direction = getComputedStyle(viewport).direction === 'rtl' ? -1 : 1;
    const atEnd = Math.abs(viewport.scrollLeft) + viewport.clientWidth >= viewport.scrollWidth - 2;
    if (step === 1 && atEnd) {
      viewport.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }
    viewport.scrollBy({ left: step * direction * slide.offsetWidth, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!isPlaying || isInteracting) return;
    const timer = window.setInterval(() => {
      scrollBySlide(1);
    }, ROTATE_EVERY_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [isInteracting, isPlaying, scrollBySlide]);

  return (
    <section ref={rootRef} aria-roledescription="carousel" aria-label={labels.region}>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className={controlClasses}
          onClick={() => {
            setChoice(isPlaying ? 'paused' : 'playing');
          }}
          aria-label={isPlaying ? labels.pause : labels.play}
        >
          {isPlaying ? (
            <Pause aria-hidden className="size-4" />
          ) : (
            <Play aria-hidden className="size-4" />
          )}
        </button>
        <button
          type="button"
          className={controlClasses}
          onClick={() => {
            scrollBySlide(-1);
          }}
          aria-label={labels.previous}
        >
          <ChevronLeft aria-hidden className="size-5 rtl-flip" />
        </button>
        <button
          type="button"
          className={controlClasses}
          onClick={() => {
            scrollBySlide(1);
          }}
          aria-label={labels.next}
        >
          <ChevronRight aria-hidden className="size-5 rtl-flip" />
        </button>
      </div>
      <div
        ref={viewportRef}
        // Focusable so keyboard users can scroll it with the arrow keys.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        aria-live={isPlaying && !isInteracting ? 'off' : 'polite'}
        className="mt-6 flex snap-x snap-mandatory [scrollbar-width:none] gap-6 overflow-x-auto scroll-smooth pb-4 motion-reduce:scroll-auto"
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={labels.slide[index]}
            className="flex w-full shrink-0 snap-start flex-col gap-6 rounded-3xl border border-border bg-card p-8 md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
          >
            <Quote aria-hidden className="size-8 text-accent" />
            <blockquote className="text-lg">{slide.quote}</blockquote>
            <div className="mt-auto flex flex-col gap-2 border-t border-border pt-5">
              <span
                className="flex gap-0.5 text-accent"
                aria-label={labels.rating[index]}
                role="img"
              >
                {Array.from({ length: slide.rating }, (_, star) => (
                  <Star key={star} aria-hidden className="size-4 fill-current" />
                ))}
              </span>
              <span className="font-medium">{slide.name}</span>
              <span className="text-sm text-muted">{slide.role}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
