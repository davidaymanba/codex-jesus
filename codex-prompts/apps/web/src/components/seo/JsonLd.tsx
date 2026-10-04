import { headers } from 'next/headers';

import { NONCE_HEADER } from '@/lib/security/csp';
import { serializeJsonLd } from '@/lib/seo/json-ld';

type JsonLdData = Parameters<typeof serializeJsonLd>[0];

/** Structured data for search engines, serialized so CMS text cannot break out of the tag. */
export async function JsonLd({ data }: { data: JsonLdData }) {
  const nonce = (await headers()).get(NONCE_HEADER) ?? undefined;
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // JSON-LD must be raw script text (React would entity-encode children). Safe:
      // serializeJsonLd escapes <, > and &, so no content can leave the script element.
      // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
