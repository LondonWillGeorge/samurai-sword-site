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
    publicId: 'Otani_Tomio_Demo_Aikido_ervqne',
    alt: 'c1982 Otani Tomio Demonstrating Aikido',
    caption: 'c1982 Otani Tomio Demonstrating Aikido',
    isCloudinary: true,
  },
  {
    publicId: '1983_Hand_Drawn_Yodokan_Poster_cc8h82',
    alt: '1983 Yodokan Club Poster - Hand Drawn',
    caption: '1983 Yodokan Club Poster - Hand Drawn',
    isCloudinary: true,
  },
  {
    publicId: 'Shihan_Glint_Sword_f6xe1t',
    alt: '2009 Demonstration Ankara, Turkey',
    caption: '2009 Demonstration Ankara, Turkey',
    isCloudinary: true,
  },
  {
    publicId: 'IMG-20250706-WA0015_hxh3vw',
    alt: 'c2016 Iaido Demonstration in Croydon',
    caption: 'c2016 Iaido Demonstration in Croydon',
    isCloudinary: true,
  },
  {
    publicId: 'Demetri_Shihan_Jo_Defense_pf85cq',
    alt: 'c2016 Jo (Staff) Defense Against Bokken (Wooden Iaido Sword) in Croydon',
    caption: 'c2016 Jo (Staff) Defense Against Bokken (Wooden Iaido Sword) in Croydon',
    isCloudinary: true,
  },
  {
    publicId: 'International_Competition1_Tsunami_Yodokan_qjyom9',
    alt: 'Kyoto, Japan - International Martial Arts Meeting',
    caption: 'Kyoto, Japan - International Martial Arts Meeting',
    isCloudinary: true,
  },
  {
    publicId: 'International_Competition2_Tsunami_Yodokan_haquc9',
    alt: 'International Martial Arts Meeting 2',
    caption: 'International Martial Arts Meeting 2',
    isCloudinary: true,
  },
];
