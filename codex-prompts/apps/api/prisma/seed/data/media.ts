import type { CreateMediaInput, LocalizedString } from '@codex/shared';

import { l, placeholderImageUrl, seedId } from '../builders.js';

interface PlaceholderSpec {
  key: string;
  width: number;
  height: number;
  alt: LocalizedString;
}

const COVER = { width: 1200, height: 630 };
const PORTRAIT = { width: 600, height: 600 };
const LOGO = { width: 400, height: 200 };
/** Rough PNG size, only so the metadata is plausible until real uploads replace it. */
const PLACEHOLDER_SIZE_BYTES = 24_000;

const cover = (key: string, alt: LocalizedString): PlaceholderSpec => ({ key, ...COVER, alt });

const SPECS: PlaceholderSpec[] = [
  cover('service-development', l('غلاف خدمة تطوير البرمجيات', 'Software development cover')),
  cover('service-branding', l('غلاف خدمة الهوية التجارية', 'Branding cover')),
  cover('service-marketing', l('غلاف خدمة التسويق الرقمي', 'Digital marketing cover')),
  ...[
    'salla-fashion',
    'academy-platform',
    'distribution-erp',
    'specialty-cafe',
    'realestate-launch',
    'ai-support',
  ].flatMap((project) => [
    cover(`project-${project}`, l('صورة غلاف المشروع', 'Project cover image')),
    cover(`project-${project}-gallery-1`, l('لقطة من المشروع', 'Project screenshot')),
    cover(`project-${project}-gallery-2`, l('لقطة ثانية من المشروع', 'Second project screenshot')),
  ]),
  cover('post-salla-vs-shopify', l('مقارنة بين سلة وشوبيفاي', 'Salla and Shopify comparison')),
  cover('post-brand-beyond-logo', l('عناصر الهوية البصرية', 'Visual identity elements')),
  cover('post-n8n-ai-automation', l('مخطط أتمتة سير العمل', 'Workflow automation diagram')),
  ...Array.from({ length: 6 }, (_, index) => ({
    key: `team-${index + 1}`,
    ...PORTRAIT,
    alt: l('صورة عضو الفريق', 'Team member photo'),
  })),
  ...Array.from({ length: 8 }, (_, index) => ({
    key: `client-${index + 1}`,
    ...LOGO,
    alt: l('شعار العميل', 'Client logo'),
  })),
  { key: 'site-logo', ...LOGO, alt: l('شعار كودكس', 'Codex logo') },
];

/** ID of a placeholder media record, for use in relations. */
export const mediaId = (key: string): string => seedId(`media:${key}`);

/** PLACEHOLDER media: `publicId` starts with `placeholder/` so they are easy to find and replace. */
export const MEDIA: (CreateMediaInput & { id: string })[] = SPECS.map(
  ({ key, width, height, alt }) => ({
    id: mediaId(key),
    url: placeholderImageUrl(width, height, 'Codex'),
    publicId: `placeholder/${key}`,
    alt,
    width,
    height,
    mimeType: 'image/png',
    sizeBytes: PLACEHOLDER_SIZE_BYTES,
  }),
);
