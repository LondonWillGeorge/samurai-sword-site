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
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number }) => void;
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
  thumbnailOverride?: string;
  caption?: string;
  aspectRatio?: 'portrait' | 'landscape' | 'square' | 'short-portrait' | 'compact';
  cropToFill?: boolean;
  showSpeedSlider?: boolean;
  className?: string;
  lazyLoad?: boolean;
}

export const YouTubeVideo = ({
  videoId,
  thumbnailOverride,
  caption,
  aspectRatio = 'portrait',
  cropToFill = false,
  showSpeedSlider = true,
  className = '',
  lazyLoad = false
}: YouTubeVideoProps) => {
  const [player, setPlayer] = useState<YTPlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Caption shows while the player is idle, paused or ended, and hides during playback.
  // Lazy-loaded players autoplay once clicked, so they start hidden.
  const [showPlayerCaption, setShowPlayerCaption] = useState(!lazyLoad);
  const [isActivated, setIsActivated] = useState(!lazyLoad);
  const [speed, setSpeed] = useState(1);
  const [availableSpeeds, setAvailableSpeeds] = useState<number[]>([0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
  const playerRef = useRef<string>(`player-${videoId}-${Math.random().toString(36).substr(2, 9)}`);

  // Best available thumbnail first: maxresdefault (1280x720, missing for many videos)
  // → sddefault (640x480) → hq1 (a real frame at 480x360, always present).
  const thumbnailCandidates = [
    ...(thumbnailOverride ? [thumbnailOverride] : []),
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hq1.jpg`,
  ];
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const isLastThumbnail = thumbnailIndex === thumbnailCandidates.length - 1;

  const tryNextThumbnail = () => {
    if (isLastThumbnail) setThumbnailLoaded(true);
    else setThumbnailIndex(i => i + 1);
  };

  // When a size is missing, YouTube serves a 120x90 grey placeholder image
  // instead of failing, so onError never fires; detect it by its size.
  const handleThumbnailLoad = (img: HTMLImageElement) => {
    if (!isLastThumbnail && img.naturalWidth <= 120) {
      tryNextThumbnail();
      return;
    }
    setThumbnailLoaded(true);
  };

  useEffect(() => {
    if (!isActivated) return;

    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        const newPlayer = new window.YT.Player(playerRef.current, {
          videoId: videoId,
          width: '100%',
          height: '100%',
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
            // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
            onStateChange: ({ data }) => {
              if (data === 1 || data === 3) setShowPlayerCaption(false);
              else if (data === 0 || data === 2 || data === 5) setShowPlayerCaption(true);
            },
          },
        });
      }
    };

    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    // Load YouTube IFrame API if not already loading
    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Use a queue system instead of overwriting the callback
    const checkAPIReady = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(checkAPIReady);
        initPlayer();
      }
    }, 100);

    return () => clearInterval(checkAPIReady);
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
      case 'compact': return 'aspect-[9/8]';
      case 'landscape': return 'aspect-video';
      case 'square': return 'aspect-square';
      default: return 'aspect-[9/16]';
    }
  };

  // Gradient only behind the text, so the rest of the image stays at full brightness
  const captionText = (
    <p className="text-accent text-base font-extrabold tracking-wider [text-shadow:0_1px_3px_rgb(0_0_0_/_0.8)]">{caption}</p>
  );
  const captionOverlay = (
    <>
      {/* Mirror of the bottom shading; the hidden copy of the caption keeps both the same height */}
      <div aria-hidden className="absolute top-0 left-0 right-0 px-4 pt-4 pb-12 bg-gradient-to-b from-black/80 via-black/50 to-transparent pointer-events-none">
        <div className="invisible">{captionText}</div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-12 bg-gradient-to-t from-black/80 via-black/50 to-transparent pointer-events-none">
        {captionText}
      </div>
    </>
  );

  // Thumbnail preview for lazy loading
  if (!isActivated) {
    return (
      <div className={`flex flex-col ${className}`}>
        <div 
          className={`group relative overflow-hidden bg-card ${getAspectRatioClass()} cursor-pointer`}
          onClick={handleActivate}
        >
          {!thumbnailLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-card">
              <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
            </div>
          )}
          <img
            src={thumbnailCandidates[thumbnailIndex]}
            alt="Video thumbnail"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${thumbnailLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={(e) => handleThumbnailLoad(e.currentTarget)}
            onError={tryNextThumbnail}
          />
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${thumbnailLoaded ? '' : 'opacity-0'}`}>
            <div className="w-16 h-16 rounded-full bg-primary/90 shadow-lg shadow-black/40 flex items-center justify-center group-hover:bg-primary transition-colors group-hover:scale-110 transform duration-200">
              <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
            </div>
          </div>
          {caption && thumbnailLoaded && captionOverlay}
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
          <div className="absolute inset-0 overflow-hidden">
            <div 
              id={playerRef.current} 
              className="absolute bottom-0 left-0 right-0 w-full h-[160%]"
            />
          </div>
        ) : (
          <div id={playerRef.current} className="w-full h-full" />
        )}
        {caption && !isLoading && showPlayerCaption && captionOverlay}
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

export const VideoPlaceholder = ({ aspectRatio = 'portrait' }: { aspectRatio?: 'portrait' | 'landscape' | 'square' | 'short-portrait' | 'compact' }) => {
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'portrait': return 'aspect-[9/16]';
      case 'short-portrait': return 'aspect-[9/12]';
      case 'compact': return 'aspect-[9/8]';
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
