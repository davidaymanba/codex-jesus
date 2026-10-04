import Image from 'next/image';

import type { Locale, MediaDto } from '@codex/shared';

import { cn } from '@/lib/utils/cn';

interface MediaImageProps {
  media: MediaDto;
  locale: Locale;
  /** `sizes` for the responsive srcset; required so phones never download desktop widths. */
  sizes: string;
  /** Only the page's LCP image. */
  isPriority?: boolean;
  /** Fill the (positioned, sized) parent instead of using the intrinsic ratio. */
  isFill?: boolean;
  className?: string;
}

/** A CMS image through `next/image` (AVIF/WebP, lazy unless it is the LCP image). */
export function MediaImage({
  media,
  locale,
  sizes,
  isPriority = false,
  isFill = false,
  className,
}: MediaImageProps) {
  const imageClassName = cn('object-cover', className);
  // The LCP image: preloaded in <head>, fetched first, never lazy (`priority` is deprecated).
  const loading = isPriority
    ? ({ preload: true, fetchPriority: 'high', loading: 'eager' } as const)
    : ({ loading: 'lazy' } as const);
  return isFill ? (
    <Image
      src={media.url}
      alt={media.alt[locale]}
      fill
      sizes={sizes}
      {...loading}
      className={imageClassName}
    />
  ) : (
    <Image
      src={media.url}
      alt={media.alt[locale]}
      width={media.width}
      height={media.height}
      sizes={sizes}
      {...loading}
      className={imageClassName}
    />
  );
}
