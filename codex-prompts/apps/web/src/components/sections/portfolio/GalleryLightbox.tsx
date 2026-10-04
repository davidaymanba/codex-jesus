'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import type { KeyboardEvent } from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';

import type { GalleryImage, GalleryLabels } from './gallery-types';

interface GalleryLightboxProps {
  images: GalleryImage[];
  labels: GalleryLabels;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  /** Focuses the thumbnail that opened the lightbox. */
  returnFocus: () => void;
}

const navClasses =
  'absolute top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-navy-950/70 text-white transition-colors hover:bg-navy-950';

/**
 * Full-size image viewer in a modal dialog (focus trapped, Escape closes, focus returns):
 * previous / next buttons and the arrow keys, wrapping around. Default export for
 * `next/dynamic`.
 */
export default function GalleryLightbox({
  images,
  labels,
  index,
  onIndexChange,
  onClose,
  returnFocus,
}: GalleryLightboxProps) {
  const image = images[index];
  const step = (delta: 1 | -1) => {
    onIndexChange((index + delta + images.length) % images.length);
  };
  // Arrow keys follow the reading direction: in RTL, the left arrow moves forward.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const isRtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    if (event.key === 'ArrowRight') step(isRtl ? -1 : 1);
    if (event.key === 'ArrowLeft') step(isRtl ? 1 : -1);
  };
  if (!image) return null;

  return (
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        closeLabel={labels.close}
        onKeyDown={onKeyDown}
        className="max-w-5xl gap-3 p-3 sm:p-4"
        aria-describedby={undefined}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus();
        }}
      >
        <DialogTitle className="text-base font-medium">{labels.counter[index]}</DialogTitle>
        <div className="relative">
          <Image
            src={image.url}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes="(min-width: 1024px) 64rem, 100vw"
            className="h-auto max-h-[75dvh] w-full rounded-xl object-contain"
          />
          {images.length > 1 ? (
            <>
              <button
                type="button"
                className={`${navClasses} start-3`}
                onClick={() => {
                  step(-1);
                }}
                aria-label={labels.previous}
              >
                <ChevronLeft aria-hidden className="size-5 rtl-flip" />
              </button>
              <button
                type="button"
                className={`${navClasses} end-3`}
                onClick={() => {
                  step(1);
                }}
                aria-label={labels.next}
              >
                <ChevronRight aria-hidden className="size-5 rtl-flip" />
              </button>
            </>
          ) : null}
        </div>
        <p className="text-sm text-muted">{image.alt}</p>
      </DialogContent>
    </Dialog>
  );
}
