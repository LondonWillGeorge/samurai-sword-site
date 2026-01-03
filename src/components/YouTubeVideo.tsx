import { useState, useRef, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Play } from 'lucide-react';

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

interface YouTubeVideoProps {
  videoId: string;
  caption?: string;
  aspectRatio?: 'portrait' | 'landscape' | 'square' | 'short-portrait';
  cropToFill?: boolean;
  showSpeedSlider?: boolean;
  className?: string;
  lazyLoad?: boolean;
}

export const YouTubeVideo = ({ 
  videoId, 
  caption, 
  aspectRatio = 'portrait',
  cropToFill = false,
  showSpeedSlider = true,
  className = '',
  lazyLoad = false
}: YouTubeVideoProps) => {
  const [player, setPlayer] = useState<YTPlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivated, setIsActivated] = useState(!lazyLoad);
  const [speed, setSpeed] = useState(1);
  const [availableSpeeds, setAvailableSpeeds] = useState<number[]>([0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
  const playerRef = useRef<string>(`player-${videoId}-${Math.random().toString(36).substr(2, 9)}`);

  // Get thumbnail URL
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const fallbackThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  useEffect(() => {
    if (!isActivated) return;

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
            autoplay: lazyLoad ? 1 : 0,
          },
          events: {
            onReady: (event) => {
              setPlayer(event.target);
              setIsLoading(false);
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
  }, [videoId, isActivated, lazyLoad]);

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

  const handleActivate = () => {
    setIsActivated(true);
  };

  const minSpeed = availableSpeeds[0] || 0.25;
  const maxSpeed = availableSpeeds[availableSpeeds.length - 1] || 2;

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'portrait': return 'aspect-[9/16]';
      case 'short-portrait': return 'aspect-[9/12]';
      case 'landscape': return 'aspect-video';
      case 'square': return 'aspect-square';
      default: return 'aspect-[9/16]';
    }
  };

  // Thumbnail preview for lazy loading
  if (!isActivated) {
    return (
      <div className={`flex flex-col ${className}`}>
        <div 
          className={`group relative overflow-hidden bg-card ${getAspectRatioClass()} cursor-pointer`}
          onClick={handleActivate}
        >
          <img 
            src={thumbnailUrl}
            alt="Video thumbnail"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackThumbnail;
            }}
          />
          <div className="absolute inset-0 bg-background/30 flex items-center justify-center group-hover:bg-background/20 transition-colors">
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:bg-primary transition-colors group-hover:scale-110 transform duration-200">
              <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
            </div>
          </div>
          {caption && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
                <p className="text-foreground text-sm tracking-wider">{caption}</p>
              </div>
            </>
          )}
        </div>
        
        {showSpeedSlider && (
          <div className="mt-4 px-2 opacity-50">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-xs">{minSpeed}x</span>
              <Slider
                value={[speed]}
                min={minSpeed}
                max={maxSpeed}
                step={0.25}
                className="flex-1"
                disabled
              />
              <span className="text-muted-foreground text-xs">{maxSpeed}x</span>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">
              Speed: {speed}x
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div className={`group relative overflow-hidden bg-card ${getAspectRatioClass()}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
            <div className="animate-pulse text-muted-foreground text-sm">Loading video...</div>
          </div>
        )}
        {cropToFill ? (
          <div className="absolute inset-x-0 inset-y-[-10%] overflow-hidden">
            <div 
              id={playerRef.current} 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[120%]"
            />
          </div>
        ) : (
          <div id={playerRef.current} className="w-full h-full" />
        )}
        {caption && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
              <p className="text-foreground text-sm tracking-wider">{caption}</p>
            </div>
          </>
        )}
      </div>
      
      {showSpeedSlider && (
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
      )}
    </div>
  );
};

export const VideoPlaceholder = ({ aspectRatio = 'portrait' }: { aspectRatio?: 'portrait' | 'landscape' | 'square' | 'short-portrait' }) => {
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'portrait': return 'aspect-[9/16]';
      case 'short-portrait': return 'aspect-[9/12]';
      case 'landscape': return 'aspect-video';
      case 'square': return 'aspect-square';
      default: return 'aspect-[9/16]';
    }
  };

  return (
    <div className="flex flex-col">
      <div className={`group relative overflow-hidden bg-card ${getAspectRatioClass()} flex items-center justify-center border border-dashed border-muted-foreground/30`}>
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
};
