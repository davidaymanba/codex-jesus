import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

import { env } from '@/config/env.js';

export interface StoredImage {
  url: string;
  publicId: string;
}

/** Where uploaded images live; Cloudinary in every real environment, a fake in tests. */
export interface MediaStorage {
  upload(image: Buffer): Promise<StoredImage>;
  destroy(publicId: string): Promise<void>;
}

/** Cloudinary storage in one folder per environment (`codex/production`, `codex/staging`…). */
export function createCloudinaryStorage(cloudinaryUrl: string, folder: string): MediaStorage {
  const { username, password, hostname } = new URL(cloudinaryUrl);
  cloudinary.config({
    cloud_name: hostname,
    api_key: decodeURIComponent(username),
    api_secret: decodeURIComponent(password),
    secure: true,
  });
  return {
    upload: (image) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: 'image', unique_filename: true, overwrite: false },
          (error, result?: UploadApiResponse) => {
            if (error || !result) {
              reject(new Error(`Cloudinary upload failed: ${error?.message ?? 'no result'}`));
              return;
            }
            resolve({ url: result.secure_url, publicId: result.public_id });
          },
        );
        stream.end(image);
      }),
    async destroy(publicId) {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
    },
  };
}

/** Unset when CLOUDINARY_URL is missing (development): uploads answer 503. */
export const mediaStorage: MediaStorage | undefined = env.CLOUDINARY_URL
  ? createCloudinaryStorage(env.CLOUDINARY_URL, env.CLOUDINARY_FOLDER ?? `codex/${env.NODE_ENV}`)
  : undefined;
