import { createNavigation } from 'next-intl/navigation';

import { routing } from './routing';

/** Locale-aware navigation helpers (paths without the prefix). */
export const { Link, redirect, permanentRedirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
