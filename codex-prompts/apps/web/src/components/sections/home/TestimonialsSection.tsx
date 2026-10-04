import { getLocale, getTranslations } from 'next-intl/server';

import { Section } from '@/components/shared/Section';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { withFallback } from '@/lib/api/fallback';
import { getTestimonials } from '@/lib/api/showcase';

import { TestimonialsCarousel } from './TestimonialsCarousel';

/** Home section 10: client testimonials in an accessible slider. */
export async function TestimonialsSection() {
  const [locale, t, testimonials] = await Promise.all([
    getLocale(),
    getTranslations('home.testimonials'),
    withFallback('home-testimonials', getTestimonials, []),
  ]);
  if (testimonials.length === 0) return null;
  const total = testimonials.length;

  return (
    <Section surface="dark">
      <SectionHeading eyebrow={t('eyebrow')} title={t('title')} />
      <div className="mt-6">
        <TestimonialsCarousel
          slides={testimonials.map((item) => ({
            id: item.id,
            quote: item.quote[locale],
            name: item.clientName,
            role: [item.role[locale], item.company].filter(Boolean).join(' · '),
            rating: item.rating,
          }))}
          labels={{
            region: t('label'),
            previous: t('previous'),
            next: t('next'),
            pause: t('pause'),
            play: t('play'),
            slide: testimonials.map((_, index) => t('slide', { index: index + 1, total })),
            rating: testimonials.map((item) => t('rating', { rating: item.rating })),
          }}
        />
      </div>
    </Section>
  );
}
