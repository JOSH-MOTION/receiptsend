/**
 * Cloudinary upload utility for SENDORA
 * Add your Cloudinary credentials to .env.local:
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
 *   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
 */

export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dfff3hdrf';
export const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'sendora';

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

/**
 * Uploads a file to Cloudinary using the unsigned upload API.
 * Requires an unsigned upload preset configured in your Cloudinary dashboard.
 */
export async function uploadToCloudinary(
  file: File,
  folder = 'sendora'
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to upload image to Cloudinary');
  }

  return response.json();
}

/**
 * Generates a Cloudinary URL with optional transformations.
 */
export function getCloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
  } = {}
): string {
  const { width, height, crop = 'fill', quality = 'auto' } = options;

  const transformations = [
    width && `w_${width}`,
    height && `h_${height}`,
    width && height && `c_${crop}`,
    `q_${quality}`,
    'f_auto',
  ]
    .filter(Boolean)
    .join(',');

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformations}/${publicId}`;
}