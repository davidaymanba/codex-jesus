import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/Badge';

/**
 * Newsletter placeholder: there is no newsletter API yet, so nothing is submitted (no form
 * element at all). Replace with a real form when the backend exists.
 */
export function FooterNewsletter() {
  const t = useTranslations('footer.newsletter');
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h2 className="font-sans text-sm font-medium tracking-wide text-muted uppercase">
          {t('title')}
        </h2>
        <Badge variant="outline">{t('comingSoon')}</Badge>
      </div>
      <p className="text-sm text-muted">{t('description')}</p>
    </div>
  );
}
