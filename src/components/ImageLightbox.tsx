import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  thumbnailSrc: string;
  fullSizeSrc: string;
  alt: string;
  caption?: string;
}

export const ImageLightbox = ({
  isOpen,
  onClose,
  thumbnailSrc,
  fullSizeSrc,
  alt,
  caption,
}: ImageLightboxProps) => {
  const [isFullLoaded, setIsFullLoaded] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Reset loaded state when closing
      setIsFullLoaded(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-background/95 backdrop-blur-sm border-primary/20">
        <VisuallyHidden>
          <DialogTitle>{alt}</DialogTitle>
        </VisuallyHidden>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-50 rounded-full bg-background/80 p-2 hover:bg-background transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-foreground" />
        </button>
        
        <div className="relative flex items-center justify-center p-4">
          {/* Thumbnail as placeholder while full image loads */}
          <img
            src={thumbnailSrc}
            alt={alt}
            className={`max-w-full max-h-[80vh] object-contain transition-opacity duration-300 ${
              isFullLoaded ? 'opacity-0 absolute' : 'opacity-100'
            }`}
          />
          
          {/* Full-size image - only loads when modal opens */}
          <img
            src={fullSizeSrc}
            alt={alt}
            className={`max-w-full max-h-[80vh] object-contain transition-opacity duration-300 ${
              isFullLoaded ? 'opacity-100' : 'opacity-0 absolute'
            }`}
            onLoad={() => setIsFullLoaded(true)}
          />
        </div>
        
        {caption && (
          <div className="px-6 pb-4 text-center">
            <p className="text-foreground text-sm tracking-wider">{caption}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
