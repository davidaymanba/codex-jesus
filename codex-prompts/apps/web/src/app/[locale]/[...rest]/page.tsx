import { notFound } from 'next/navigation';

// Any unknown path inside a locale renders the localized 404 (app/[locale]/not-found.tsx).
export default function CatchAllPage() {
  notFound();
}
