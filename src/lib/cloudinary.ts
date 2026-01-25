// Cloudinary configuration and URL helpers

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';

interface CloudinaryTransform {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb';
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
}

/**
 * Generate a Cloudinary URL with transformations
 */
export const getCloudinaryUrl = (
  publicId: string,
  transform?: CloudinaryTransform
): string => {
  if (!CLOUD_NAME) {
    console.warn('VITE_CLOUDINARY_CLOUD_NAME is not set');
    return '';
  }

  const baseUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

  if (!transform) {
    return `${baseUrl}/${publicId}`;
  }

  const transformParts: string[] = [];

  if (transform.width) transformParts.push(`w_${transform.width}`);
  if (transform.height) transformParts.push(`h_${transform.height}`);
  if (transform.crop) transformParts.push(`c_${transform.crop}`);
  if (transform.quality) transformParts.push(`q_${transform.quality}`);
  if (transform.format) transformParts.push(`f_${transform.format}`);

  const transformString = transformParts.join(',');

  return `${baseUrl}/${transformString}/${publicId}`;
};

/**
 * Get thumbnail URL (optimized for gallery grid)
 */
export const getThumbnailUrl = (publicId: string): string => {
  return getCloudinaryUrl(publicId, {
    width: 400,
    height: 500,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  });
};

/**
 * Get full-size URL (optimized for lightbox view)
 */
export const getFullSizeUrl = (publicId: string): string => {
  return getCloudinaryUrl(publicId, {
    quality: 'auto',
    format: 'auto',
  });
};

// Gallery image definitions - add new images here
export interface GalleryImage {
  publicId: string;
  alt: string;
  caption: string;
  isCloudinary: boolean;
}

export const cloudinaryImages: GalleryImage[] = [
  {
    publicId: '1983_Hand_Drawn_Yodokan_Poster_cc8h82',
    alt: '1983 Yodokan Club Poster - Hand Drawn',
    caption: '1983 Yodokan Club Poster - Hand Drawn',
    isCloudinary: true,
  },
];
