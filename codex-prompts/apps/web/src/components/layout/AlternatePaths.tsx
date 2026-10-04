'use client';

import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { Locale } from '@codex/shared/constants';

/** The current page's path in each locale, when they differ (localized slugs). */
export type AlternatePaths = Partial<Record<Locale, string>>;

const AlternatePathsContext = createContext<{
  paths: AlternatePaths;
  setPaths: (paths: AlternatePaths) => void;
}>({ paths: {}, setPaths: () => undefined });

export function AlternatePathsProvider({ children }: { children: ReactNode }) {
  const [paths, setPaths] = useState<AlternatePaths>({});
  const value = useMemo(() => ({ paths, setPaths }), [paths]);
  return <AlternatePathsContext value={value}>{children}</AlternatePathsContext>;
}

export const useAlternatePaths = (): AlternatePaths => use(AlternatePathsContext).paths;

/**
 * Rendered by a page whose URL differs per locale (e.g. `/services/<slugAr>` vs
 * `/services/<slugEn>`), so the language switcher keeps the visitor on the same content. The
 * slugs come with every public DTO (`slugAr`/`slugEn`), so no extra request is needed.
 */
export function RegisterAlternatePaths(paths: AlternatePaths) {
  const { setPaths } = use(AlternatePathsContext);
  const { ar, en } = paths;
  useEffect(() => {
    setPaths({ ...(ar && { ar }), ...(en && { en }) });
    return () => {
      setPaths({});
    };
  }, [ar, en, setPaths]);
  return null;
}
