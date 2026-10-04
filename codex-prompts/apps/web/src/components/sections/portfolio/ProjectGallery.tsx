'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRef, useState } from 'react';

import type { GalleryImage, GalleryLabels } from './gallery-types';

// The lightbox (Radix Dialog) loads on the first click only.
const GalleryLightbox = dynamic(() => import('./GalleryLightbox'), { ssr: false });

/**
 * Case-study images as a grid of buttons; one opens the accessible lightbox at that image.
 * Focus returns to the clicked thumbnail when the lightbox closes (Radix Dialog).
 */
export function ProjectGallery({
  images,
  labels,
}: {
  images: GalleryImage[];
  labels: GalleryLabels;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // The lightbox has no Radix trigger, so it is told where focus goes back to.
  const openerRef = useRef<HTMLButtonElement | null>(null);

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2">
        {images.map((image, index) => (
          <li
            key={image.id}
            className={images.length % 2 === 1 && index === 0 ? 'sm:col-span-2' : undefined}
          >
            <button
              type="button"
              onClick={(event) => {
                openerRef.current = event.currentTarget;
                setOpenIndex(index);
              }}
              aria-label={labels.open[index]}
              className="group block w-full overflow-hidden rounded-2xl border border-border"
            >
              <Image
                src={image.url}
                alt=""
                width={image.width}
                height={image.height}
                sizes="(min-width: 640px) 50vw, 100vw"
                className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>
      {openIndex === null ? null : (
        <GalleryLightbox
          images={images}
          labels={labels}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={() => {
            setOpenIndex(null);
          }}
          returnFocus={() => {
            openerRef.current?.focus();
          }}
        />
      )}
    </>
  );
}
