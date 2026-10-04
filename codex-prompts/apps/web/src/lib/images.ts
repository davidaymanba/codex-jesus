/**
 * Hosts `next/image` may load from: Cloudinary (all uploads) and the seed's placeholder media
 * (local and preview databases). Rich-text images from any other host are not rendered.
 */
export const REMOTE_IMAGE_HOSTS = ['res.cloudinary.com', 'placehold.co'] as const;

/** An https image on an allowed host. */
export function isAllowedImageUrl(src: string): boolean {
  try {
    const url = new URL(src);
    return (
      url.protocol === 'https:' && (REMOTE_IMAGE_HOSTS as readonly string[]).includes(url.hostname)
    );
  } catch {
    return false;
  }
}
