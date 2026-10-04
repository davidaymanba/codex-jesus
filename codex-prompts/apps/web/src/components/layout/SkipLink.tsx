import { useTranslations } from 'next-intl';

export const MAIN_CONTENT_ID = 'main-content';

/** First focusable element: jumps keyboard users past the navigation. */
export function SkipLink() {
  const t = useTranslations('a11y');
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only rounded-full bg-gold-500 px-5 py-3 font-medium text-navy-950 focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60]"
    >
      {t('skipToContent')}
    </a>
  );
}
