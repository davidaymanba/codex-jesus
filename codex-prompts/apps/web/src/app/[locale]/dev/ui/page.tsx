import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { Container } from '@/components/shared/Container';
import { ShowcaseSurface } from '@/components/showcase/ShowcaseSurface';
import { Toaster } from '@/components/ui/Toaster';
import { serverEnv } from '@/env/server';

const isShowcaseAvailable = () =>
  serverEnv.NODE_ENV !== 'production' || serverEnv.ENABLE_UI_SHOWCASE;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('showcase');
  return { title: t('title'), robots: { index: false, follow: false } };
}

/** Development-only review page: every component, on both surfaces (docs/phases/04 §13). */
export default async function UiShowcasePage() {
  if (!isShowcaseAvailable()) notFound();
  const t = await getTranslations('showcase');
  return (
    <>
      <Container className="py-16">
        <h1 className="text-5xl">{t('title')}</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">{t('description')}</p>
      </Container>
      <ShowcaseSurface surface="dark" />
      <ShowcaseSurface surface="light" />
      <Toaster />
    </>
  );
}
