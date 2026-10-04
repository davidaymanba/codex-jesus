import { getTranslations } from 'next-intl/server';

import { ROUTES } from '@/lib/routes';

import { CtaBanner } from './CtaBanner';

/** The standard closing call to action of inner pages (quote first, contact second). */
export async function PageCta({ quoteHref = ROUTES.QUOTE }: { quoteHref?: string }) {
  const t = await getTranslations('pageCta');
  return (
    <CtaBanner
      title={t('title')}
      description={t('description')}
      primary={{ label: t('primary'), href: quoteHref }}
      secondary={{ label: t('secondary'), href: ROUTES.CONTACT }}
    />
  );
}
