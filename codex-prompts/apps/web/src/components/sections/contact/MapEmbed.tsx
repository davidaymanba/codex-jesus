'use client';

import { MapPin } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';

interface MapEmbedProps {
  address: string;
  labels: { load: string; notice: string; open: string; frameTitle: string };
}

const mapsQuery = (address: string) => encodeURIComponent(address);

/**
 * A drawn placeholder that loads Google Maps only on request: no third-party request, cookie
 * or layout cost until the visitor asks for the map.
 */
export function MapEmbed({ address, labels }: MapEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const openHref = `https://www.google.com/maps/search/?api=1&query=${mapsQuery(address)}`;

  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-border bg-card md:aspect-[21/9]">
      {isLoaded ? (
        <iframe
          title={labels.frameTitle}
          src={`https://www.google.com/maps?q=${mapsQuery(address)}&output=embed`}
          className="absolute inset-0 size-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          // Maps needs its own scripts and storage; popups open "View larger map". The frame
          // is cross-origin, so these never reach this page.
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[linear-gradient(to_right,var(--surface-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--surface-border)_1px,transparent_1px)] bg-size-[2.5rem_2.5rem] p-6 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg">
            <MapPin aria-hidden className="size-7" />
          </span>
          <p className="max-w-sm text-sm text-muted">{labels.notice}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              onClick={() => {
                setIsLoaded(true);
              }}
            >
              {labels.load}
            </Button>
            <Button asChild variant="outline">
              <a href={openHref} target="_blank" rel="noopener noreferrer">
                {labels.open}
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
