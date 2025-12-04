import trainingSeminar from '@/assets/training-seminar.jpg';
import shihanPose from '@/assets/shihan-iaido-pose.jpg';
import otaniTomio from '@/assets/otani-tomio.jpg';
import abbeKenshiro from '@/assets/abbe-kenshiro.jpg';

const galleryImages = [
  { src: trainingSeminar, alt: 'Combined training seminar', caption: 'Combined Training Seminar' },
  { src: shihanPose, alt: 'Shihan performing iaido', caption: 'Iaido Demonstration' },
  { src: otaniTomio, alt: 'Otani Sensei', caption: 'Otani Tomio Sensei' },
  { src: abbeKenshiro, alt: 'Abbe Kenshiro Sensei', caption: 'Abbe Kenshiro Sensei' },
];

export const GallerySection = () => {
  return (
    <section id="gallery" className="py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary tracking-[0.3em] text-sm mb-4">GALLERY</p>
          <h2 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
            Moments in Time
          </h2>
          <div className="section-divider" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className="group relative overflow-hidden bg-card aspect-[3/4]"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-foreground text-sm tracking-wider">{image.caption}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground text-sm">
            More photos from our training sessions and events coming soon
          </p>
        </div>
      </div>
    </section>
  );
};
