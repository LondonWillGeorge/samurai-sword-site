import { useState } from 'react';
import { YouTubeVideo, VideoPlaceholder } from '@/components/YouTubeVideo';
import { ImageLightbox } from '@/components/ImageLightbox';
import { cloudinaryImages, getThumbnailUrl, getFullSizeUrl } from '@/lib/cloudinary';

export const GallerySection = () => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    thumbnail: string;
    fullSize: string;
    alt: string;
    caption: string;
  } | null>(null);

  const openLightbox = (thumbnail: string, fullSize: string, alt: string, caption: string) => {
    setSelectedImage({ thumbnail, fullSize, alt, caption });
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedImage(null);
  };

  return (
    <section id="gallery" className="py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary tracking-[0.3em] text-sm mb-4">GALLERY</p>
          <h2 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
            Old and New Club Photos
          </h2>
          <p className="text-muted-foreground tracking-[0.3em] text-sm mb-4">Click photo to enlarge</p>
          <div className="section-divider" />
        </div>

        {/* Images Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">

          {/* Cloudinary images */}
          {cloudinaryImages.map((image, index) => {
            const thumbnailUrl = getThumbnailUrl(image.publicId);
            const fullSizeUrl = getFullSizeUrl(image.publicId);
            
            return (
              <div
                key={`cloudinary-${index}`}
                className="group relative overflow-hidden bg-card aspect-[3/4] cursor-pointer"
                onClick={() => openLightbox(thumbnailUrl, fullSizeUrl, image.alt, image.caption)}
              >
                <img
                  src={thumbnailUrl}
                  alt={image.alt}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-foreground text-sm tracking-wider">{image.caption}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lightbox Modal */}
        {selectedImage && (
          <ImageLightbox
            isOpen={lightboxOpen}
            onClose={closeLightbox}
            thumbnailSrc={selectedImage.thumbnail}
            fullSizeSrc={selectedImage.fullSize}
            alt={selectedImage.alt}
            caption={selectedImage.caption}
          />
        )}

        {/* Videos Section */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <p className="text-primary tracking-[0.3em] text-sm mb-4">VIDEOS</p>
            <h3 className="font-heading text-3xl md:text-4xl text-foreground mb-4">
              Tenshin Ryu In Motion
            </h3>
            <div className="section-divider" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <YouTubeVideo 
              videoId="4LcpgyGT9_Y" 
              caption="Jo (4-foot staff) Kata" 
            />
            <YouTubeVideo 
              videoId="6LfYWCkKG0U" 
              caption="Sword Kata Moves followed by Tameshigiri Cutting"
            />
            <YouTubeVideo 
              videoId="FFOFYasid8M"
              caption="Tonfa Strikes Kata"
            />
            {/* <VideoPlaceholder /> */}
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground text-sm">
            More photos and videos from our training sessions and events coming soon
          </p>
        </div>
      </div>
    </section>
  );
};
