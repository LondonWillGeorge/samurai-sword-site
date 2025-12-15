import { useState, useRef, useEffect } from 'react';
import trainingSeminar from '@/assets/training-seminar.jpg';
import shihanPose from '@/assets/shihan-iaido-pose.jpg';
import otaniTomio from '@/assets/otani-tomio.jpg';
import abbeKenshiro from '@/assets/abbe-kenshiro.jpg';
import { Slider } from '@/components/ui/slider';

const galleryImages = [
  { src: trainingSeminar, alt: 'Combined training seminar', caption: 'Combined Training Seminar' },
  { src: shihanPose, alt: 'Shihan performing iaido', caption: 'Iaido Demonstration' },
  { src: otaniTomio, alt: 'Otani Sensei', caption: 'Otani Tomio Sensei' },
  { src: abbeKenshiro, alt: 'Abbe Kenshiro Sensei', caption: 'Abbe Kenshiro Sensei' },
];

// YouTube IFrame API types
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  setPlaybackRate: (rate: number) => void;
  getPlaybackRate: () => number;
  getAvailablePlaybackRates: () => number[];
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
}

const VideoWithSpeedControl = ({ videoId, caption }: { videoId: string; caption: string }) => {
  const [player, setPlayer] = useState<YTPlayer | null>(null);
  const [speed, setSpeed] = useState(1);
  const [availableSpeeds, setAvailableSpeeds] = useState<number[]>([0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
  const playerRef = useRef<string>(`player-${videoId}-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // Load YouTube IFrame API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        const newPlayer = new window.YT.Player(playerRef.current, {
          videoId: videoId,
          playerVars: {
            playsinline: 1,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: (event) => {
              setPlayer(event.target);
              const rates = event.target.getAvailablePlaybackRates();
              if (rates && rates.length > 0) {
                setAvailableSpeeds(rates);
              }
            },
          },
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }
  }, [videoId]);

  const handleSpeedChange = (value: number[]) => {
    const newSpeed = value[0];
    setSpeed(newSpeed);
    
    if (player) {
      player.setPlaybackRate(newSpeed);
      
      // Mute if speed is not 1x
      if (newSpeed !== 1) {
        player.mute();
      } else {
        player.unMute();
      }
    }
  };

  const minSpeed = availableSpeeds[0] || 0.25;
  const maxSpeed = availableSpeeds[availableSpeeds.length - 1] || 2;

  return (
    <div className="flex flex-col">
      <div className="group relative overflow-hidden bg-card aspect-[9/16]">
        <div id={playerRef.current} className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
          <p className="text-foreground text-sm tracking-wider">{caption}</p>
        </div>
      </div>
      
      {/* Speed Slider */}
      <div className="mt-4 px-2">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-xs">{minSpeed}x</span>
          <Slider
            value={[speed]}
            onValueChange={handleSpeedChange}
            min={minSpeed}
            max={maxSpeed}
            step={0.25}
            className="flex-1"
          />
          <span className="text-muted-foreground text-xs">{maxSpeed}x</span>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Speed: {speed}x {speed !== 1 && '(muted)'}
        </p>
      </div>
    </div>
  );
};

const VideoPlaceholder = () => (
  <div className="flex flex-col">
    <div className="group relative overflow-hidden bg-card aspect-[9/16] flex items-center justify-center border border-dashed border-muted-foreground/30">
      <p className="text-muted-foreground text-sm text-center px-4">Video coming soon</p>
    </div>
    <div className="mt-4 px-2 opacity-50">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground text-xs">0.25x</span>
        <Slider value={[1]} min={0.25} max={2} step={0.25} className="flex-1" disabled />
        <span className="text-muted-foreground text-xs">2x</span>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-2">Speed: 1x</p>
    </div>
  </div>
);

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
              In Motion
            </h3>
            <div className="section-divider" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <VideoWithSpeedControl 
              videoId="4LcpgyGT9_Y" 
              caption="Iaido Training" 
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
