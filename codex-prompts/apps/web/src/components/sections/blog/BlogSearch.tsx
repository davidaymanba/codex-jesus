import { Search } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { FIELD_LIMITS, type Locale } from '@codex/shared';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/lib/routes';
import { localizedPath } from '@/lib/seo/metadata';

/** Server-side search: a plain GET form to /blog?q=…, so it works without JavaScript. */
export async function BlogSearch({
  locale,
  query,
}: {
  locale: Locale;
  query?: string | undefined;
}) {
  const t = await getTranslations('blog.search');
  return (
    <form
      role="search"
      action={localizedPath(locale, ROUTES.BLOG)}
      method="get"
      className="mt-4 flex max-w-xl gap-2"
    >
      <label htmlFor="blog-search" className="sr-only">
        {t('label')}
      </label>
      <Input
        id="blog-search"
        type="search"
        name="q"
        defaultValue={query}
        placeholder={t('placeholder')}
        minLength={FIELD_LIMITS.SEARCH_QUERY.MIN}
        maxLength={FIELD_LIMITS.SEARCH_QUERY.MAX}
        required
        className="flex-1"
      />
      <Button type="submit" size="lg" className="shrink-0">
        <Search aria-hidden />
        <span className="max-sm:sr-only">{t('submit')}</span>
      </Button>
    </form>
  );
}
