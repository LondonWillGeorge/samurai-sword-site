import trainingSeminar from '@/assets/training-seminar.jpg';
import otaniDemoAikido from '@/assets/Otani_Tomio_Demo_Aikido.png';
import fierceIaidokaPoster from '@/assets/1983_Hand_Drawn_Yodokan_Poster_450px.jpeg';
import { YouTubeVideo, VideoPlaceholder } from '@/components/YouTubeVideo';

const galleryImages = [
  { src: trainingSeminar, alt: 'Kagami Biraki 2022 Japanese New Year', caption: 'Kagami Biraki 2022 Japanese New Year' },
  { src: otaniDemoAikido, alt: 'Otani Tomio Demonstrating Aikido c.1982', caption: 'Otani Tomio Demonstrating Aikido c.1982' },
  { src: fierceIaidokaPoster, alt: '1983 Yodokan Club Poster - Hand Drawn', caption: '1983 Yodokan Club Poster - Hand Drawn' },
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

        {/* Images Grid */}
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

        {/* Videos Section */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <p className="text-primary tracking-[0.3em] text-sm mb-4">VIDEOS</p>
            <h3 className="font-heading text-3xl md:text-4xl text-foreground mb-4">
              Tenshin In Motion
            </h3>
            <div className="section-divider" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <YouTubeVideo 
              videoId="4LcpgyGT9_Y" 
              caption="Jo (4-foot staff) Kata" 
            />
            <VideoPlaceholder />
            <VideoPlaceholder />
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
