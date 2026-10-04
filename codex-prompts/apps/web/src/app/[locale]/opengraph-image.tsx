import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';

import { BRAND_COLORS, LOCALES, ServiceCategory, type Locale } from '@codex/shared';

import { DEFAULT_OG_IMAGE, SITE_NAME } from '@/lib/seo/metadata';

export const size = { width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height };
export const contentType = 'image/png';
export const alt = SITE_NAME;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// Satori (next/og) cannot shape Arabic script (its font engine lacks the GSUB lookups Arabic
// fonts use), so only Latin text is drawn: the wordmark everywhere, the pillars in English.
const HAS_SHAPED_TEXT: Record<Locale, boolean> = { ar: false, en: true };

/** Default social share image in brand style, per locale. */
export default async function OpenGraphImage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale: 'en', namespace: 'serviceCategories' });
  const pillars = Object.values(ServiceCategory)
    .map((category) => t(category))
    .join('  ·  ');

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        padding: 96,
        gap: 40,
        background: `radial-gradient(circle at 85% 15%, ${BRAND_COLORS.blue700} 0%, ${BRAND_COLORS.navy950} 55%)`,
        color: BRAND_COLORS.white,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 140,
            height: 140,
            borderRadius: 28,
            border: `10px solid ${BRAND_COLORS.white}`,
            borderRight: 'none',
            color: BRAND_COLORS.gold500,
            fontSize: 64,
            fontWeight: 700,
          }}
        >
          {'{}'}
        </div>
        <div style={{ fontSize: 128, fontWeight: 700, letterSpacing: -2 }}>{SITE_NAME}</div>
      </div>
      {HAS_SHAPED_TEXT[locale] ? (
        <div style={{ fontSize: 40, color: BRAND_COLORS.lavender200 }}>{pillars}</div>
      ) : null}
    </div>,
    size,
  );
}
