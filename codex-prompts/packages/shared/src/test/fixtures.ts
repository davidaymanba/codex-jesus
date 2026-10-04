/** Minimal valid values shared by schema tests. */
export const ID = '01928f3e-7b1a-7c3d-8e4f-5a6b7c8d9e0f';

export const localized = (ar: string, en: string) => ({ ar, en });

export const richText = (text: string) => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

export const localizedRichText = {
  ar: richText('نص تجريبي'),
  en: richText('Sample text'),
};
