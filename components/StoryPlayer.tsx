import React, { useState, useEffect, useRef } from 'react';
import { StoryData, AspectRatio, TransitionStyle, CaptionPosition, FontSize } from '../types';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Settings, X, Eye, EyeOff } from 'lucide-react';

interface StoryPlayerProps {
  data: StoryData;
  onReset: () => void;
}

const StoryPlayer: React.FC<StoryPlayerProps> = ({ data, onReset }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false); 
  const [isMuted, setIsMuted] = useState(false);
  
  // Progress & Scrubbing
  const [progress, setProgress] = useState(0); // 0 to 1 for current scene
  const [isScrubbing, setIsScrubbing] = useState(false);
  
  // Local state for customizations
  const [captionPos, setCaptionPos] = useState<CaptionPosition>(data.captionPosition || CaptionPosition.BOTTOM);
  const [captionSize, setCaptionSize] = useState<FontSize>(data.fontSize || FontSize.MEDIUM);
  const [showCaptions, setShowCaptions] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const seekTargetRef = useRef<number | null>(null);
  
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-play on mount
  useEffect(() => {
    setIsPlaying(true);
  }, []);

  // Control visibility logic
  useEffect(() => {
    const show = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
      }
    };
    
    window.addEventListener('mousemove', show);
    return () => {
       window.removeEventListener('mousemove', show);
       if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    }
  }, [isPlaying]);

  const currentScene = data.scenes[currentIndex];

  // Audio Progress Tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
       if (!isScrubbing && audio.duration) {
          setProgress(audio.currentTime / audio.duration);
       }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    return () => audio.removeEventListener('timeupdate', onTimeUpdate);
  }, [isScrubbing]);

  // Audio & Progression Logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Clear previous fallback timeout
    if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
    }

    audio.pause();
    
    // Reset progress when scene changes
    if (!isScrubbing) setProgress(0);

    const onLoadedMetadata = () => {
        if (seekTargetRef.current !== null && audio.duration) {
            audio.currentTime = seekTargetRef.current * audio.duration;
            seekTargetRef.current = null;
        }
        if (isPlaying) {
            audio.play().catch(e => {
                console.warn("Audio play failed, using fallback timer", e);
                const duration = currentScene.duration 
                  ? currentScene.duration * 1000 
                  : Math.max(5000, currentScene.narration.length * 70);
                fallbackTimeoutRef.current = setTimeout(() => handleNext(), duration);
            });
        }
    };

    const onEnded = () => handleNext();

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    if (currentScene.audioUrl) {
      audio.src = currentScene.audioUrl;
      audio.load();
    } else {
      audio.src = "";
      if (isPlaying) {
         const duration = currentScene.duration 
            ? currentScene.duration * 1000 
            : Math.max(5000, currentScene.narration.length * 70);
         fallbackTimeoutRef.current = setTimeout(() => handleNext(), duration);
      }
    }

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
      if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
    };
  }, [currentIndex, currentScene.audioUrl]); // isPlaying excluded to avoid reload on toggle

  // Handle Play/Pause toggling effects
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
         if (audioRef.current.src && audioRef.current.src !== window.location.href) {
            if (audioRef.current.paused) {
                audioRef.current.play().catch(console.error);
            }
         } else {
             if (!fallbackTimeoutRef.current) {
                 const duration = currentScene.duration 
                    ? currentScene.duration * 1000 
                    : Math.max(5000, currentScene.narration.length * 70);
                 fallbackTimeoutRef.current = setTimeout(() => handleNext(), duration);
             }
         }
      } else {
        audioRef.current.pause();
        if (fallbackTimeoutRef.current) {
            clearTimeout(fallbackTimeoutRef.current);
            fallbackTimeoutRef.current = null;
        }
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);

  // Scrubbing Logic
  const handleScrub = (clientX: number) => {
      if (!progressBarRef.current) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const width = rect.width;
      const x = Math.max(0, Math.min(clientX - rect.left, width));
      
      const totalScenes = data.scenes.length;
      const percentTotal = x / width;
      
      let targetIndex = Math.floor(percentTotal * totalScenes);
      targetIndex = Math.max(0, Math.min(targetIndex, totalScenes - 1));
      
      // Calculate percent within the target scene
      const rawVal = percentTotal * totalScenes;
      let percentInScene = rawVal - Math.floor(rawVal);
      if (rawVal >= totalScenes) percentInScene = 1; 

      if (targetIndex !== currentIndex) {
          seekTargetRef.current = percentInScene;
          setCurrentIndex(targetIndex);
          setProgress(percentInScene);
      } else {
          // Seek within current
          if (audioRef.current && audioRef.current.duration) {
              audioRef.current.currentTime = percentInScene * audioRef.current.duration;
              setProgress(percentInScene);
          }
      }
  };

  const onMouseDown = (e: React.MouseEvent) => {
      setIsScrubbing(true);
      handleScrub(e.clientX);
  };

  useEffect(() => {
      if (isScrubbing) {
          const onMove = (e: MouseEvent) => handleScrub(e.clientX);
          const onUp = () => setIsScrubbing(false);
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
          return () => {
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
          };
      }
  }, [isScrubbing, currentIndex]);

  const handleNext = () => {
    if (currentIndex < data.scenes.length - 1) {
        setCurrentIndex(prev => prev + 1);
    } else {
        setIsPlaying(false);
        setShowControls(true);
    }
  };

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  // Styles Helpers
  const getContainerStyle = (ratio?: AspectRatio) => {
    switch (ratio) {
      case AspectRatio.PORTRAIT: return { aspectClass: 'aspect-[9/16] h-[85vh]', widthClass: 'max-w-md' };
      case AspectRatio.PORTRAIT_ALT: return { aspectClass: 'aspect-[3/4] h-[85vh]', widthClass: 'max-w-lg' };
      case AspectRatio.SQUARE: return { aspectClass: 'aspect-square h-[85vh]', widthClass: 'max-w-2xl' };
      default: return { aspectClass: 'aspect-video w-[90vw]', widthClass: 'max-w-6xl' };
    }
  };

  const getTransitionClass = (style: TransitionStyle, isActive: boolean, isPast: boolean) => {
    switch (style) {
      case TransitionStyle.SLIDE:
        if (isActive) return 'translate-x-0 opacity-100 z-10';
        return isPast ? '-translate-x-full opacity-100 z-0' : 'translate-x-full opacity-0 z-0';
      case TransitionStyle.ZOOM_WARP:
        if (isActive) return 'scale-100 opacity-100 blur-0 z-10';
        return isPast ? 'scale-[1.5] opacity-0 blur-lg z-0' : 'scale-[0.8] opacity-0 blur-md z-0';
      default: // Cinematic
        return isActive ? 'opacity-100 z-10 scale-100 blur-0 grayscale-0' : 'opacity-0 z-0 scale-105 blur-2xl grayscale';
    }
  };

  const getCaptionStyles = (pos: CaptionPosition, size: FontSize) => {
    let containerClass = "absolute z-30 w-full px-6 flex text-center transition-all duration-500 pointer-events-none";
    let textClass = "font-bold text-white/95 drop-shadow-md tracking-wide shadow-black/50 pointer-events-auto";

    // Position
    if (pos === CaptionPosition.TOP) containerClass += " top-8 items-start justify-center";
    else if (pos === CaptionPosition.CENTER) containerClass += " inset-0 items-center justify-center";
    else if (pos === CaptionPosition.BELOW) containerClass = "w-full py-6 text-center bg-black border-t border-zinc-900"; 
    else containerClass += " bottom-12 items-end justify-center"; 

    // Size
    if (size === FontSize.SMALL) textClass += " text-base sm:text-lg leading-relaxed";
    else if (size === FontSize.LARGE) textClass += " text-xl sm:text-2xl leading-snug";
    else if (size === FontSize.EXTRA_LARGE) textClass += " text-2xl sm:text-3xl leading-tight uppercase tracking-widest";
    else textClass += " text-lg sm:text-xl leading-normal"; // Medium

    // Background for overlay
    if (pos !== CaptionPosition.BELOW) {
       textClass += " bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl box-decoration-clone border border-white/10 shadow-lg";
    }

    return { containerClass, textClass };
  };

  const { aspectClass, widthClass } = getContainerStyle(data.aspectRatio);
  const transitionStyle = data.transitionStyle || TransitionStyle.CINEMATIC;
  const { containerClass, textClass } = getCaptionStyles(captionPos, captionSize);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50 animate-fade-in">
      
      {/* Hidden Audio */}
      <audio ref={audioRef} className="hidden" />

      {/* Main Container */}
      <div className={`relative ${widthClass} ${aspectClass} group bg-zinc-900 shadow-2xl overflow-hidden ring-1 ring-zinc-800`}>
        
        {/* Scenes */}
        <div className="absolute inset-0 bg-black">
          {data.scenes.map((scene, idx) => {
            const isActive = idx === currentIndex;
            const isPast = idx < currentIndex;
            const tClass = getTransitionClass(transitionStyle, isActive, isPast);
            const kenBurns = idx % 2 === 0 ? 'animate-ken-burns-in' : 'animate-ken-burns-out';
            
            return (
              <div
                key={scene.id}
                className={`absolute inset-0 transition-all cubic-bezier(0.4, 0, 0.2, 1) duration-[1200ms] ${tClass}`}
              >
                <img 
                  src={scene.imageData} 
                  alt={`Scene ${idx + 1}`} 
                  className={`w-full h-full object-cover ${isActive ? kenBurns : ''}`}
                  style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} 
                />
                {/* Vignette */}
                <div className="absolute inset-0 bg-radial-gradient-vignette opacity-40 pointer-events-none"></div>
              </div>
            );
          })}
        </div>

        {/* Captions (Overlay Modes) */}
        {showCaptions && captionPos !== CaptionPosition.BELOW && (
          <div className={containerClass}>
             <p key={currentIndex} className={`${textClass} animate-text-reveal max-w-[85%]`}>
              {currentScene.narration}
            </p>
          </div>
        )}

        {/* Floating Controls Overlay */}
        <div 
          className={`absolute inset-x-0 bottom-0 pt-32 pb-6 px-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-500 z-40 ${
            showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
           {/* Interactive Timeline Scrubber */}
           <div 
             ref={progressBarRef}
             onMouseDown={onMouseDown}
             className="flex gap-1.5 h-3 mb-6 cursor-pointer relative group/timeline items-center"
           >
              {/* Hit Area */}
              <div className="absolute -inset-y-4 inset-x-0 z-20"></div>

              {data.scenes.map((_, idx) => (
                <div key={idx} className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm transition-all group-hover/timeline:h-2">
                    <div 
                      className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] relative"
                      style={{
                        width: idx < currentIndex ? '100%' : (idx === currentIndex ? `${progress * 100}%` : '0%'),
                      }}
                    >
                       {/* Scrubber Tip/Glow for active scene */}
                       {idx === currentIndex && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-3 w-3 bg-white rounded-full shadow-lg opacity-0 group-hover/timeline:opacity-100 transition-opacity"></div>
                       )}
                    </div>
                </div>
              ))}
           </div>

           {/* Buttons */}
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <button onClick={() => setIsPlaying(!isPlaying)} className="hover:scale-110 transition-transform text-white">
                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                 </button>
                 <div className="flex items-center gap-2 text-white/50">
                    <button onClick={handlePrev} className="hover:text-white transition-colors"><SkipBack size={20} /></button>
                    <button onClick={handleNext} className="hover:text-white transition-colors"><SkipForward size={20} /></button>
                 </div>
                 <div className="h-4 w-px bg-white/20 mx-2"></div>
                 <button onClick={() => setIsMuted(!isMuted)} className="text-white/70 hover:text-white transition-colors">
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                 </button>
                 <div className="text-xs font-mono text-white/50 tracking-widest ml-2">
                    SCENE {currentIndex + 1} / {data.scenes.length}
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <button 
                   onClick={() => setShowSettings(!showSettings)}
                   className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-white text-black' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                 >
                   <Settings size={20} />
                 </button>
                 <button 
                   onClick={onReset}
                   className="px-4 py-1.5 rounded-lg border border-white/20 text-xs font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors"
                 >
                   Edit
                 </button>
              </div>
           </div>
        </div>

        {/* Settings Popover */}
        {showSettings && (
           <div className="absolute bottom-24 right-8 w-72 glass-panel p-5 rounded-xl animate-fade-in z-50 pointer-events-auto border border-white/10 shadow-2xl">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
                 <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Appearance</span>
                 <button onClick={() => setShowSettings(false)}><X size={14} className="text-zinc-500 hover:text-white" /></button>
              </div>
              
              {/* Caption Visibility Toggle */}
              <div className="mb-5">
                 <button 
                   onClick={() => setShowCaptions(!showCaptions)}
                   className="flex items-center justify-between w-full group"
                 >
                   <span className="text-[10px] text-zinc-500 uppercase font-semibold group-hover:text-zinc-300 transition-colors flex items-center gap-2">
                     {showCaptions ? <Eye size={12} /> : <EyeOff size={12} />}
                     Captions
                   </span>
                   <div className={`w-9 h-5 rounded-full relative transition-colors border border-transparent ${showCaptions ? 'bg-indigo-600' : 'bg-zinc-800 border-zinc-700'}`}>
                      <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all shadow-sm`} style={{ left: showCaptions ? 'calc(100% - 16px)' : '2px' }}></div>
                   </div>
                 </button>
              </div>

              <div className={`space-y-5 transition-opacity duration-300 ${showCaptions ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                 <div>
                    <label className="text-[10px] text-zinc-500 uppercase mb-2 block font-semibold">Position</label>
                    <div className="grid grid-cols-1 gap-1">
                      {Object.values(CaptionPosition).map((pos) => (
                        <button key={pos} onClick={() => setCaptionPos(pos)} className={`text-left text-xs px-3 py-2 rounded-lg transition-all ${captionPos === pos ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:bg-white/5'}`}>{pos}</button>
                      ))}
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] text-zinc-500 uppercase mb-2 block font-semibold">Font Size</label>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.values(FontSize).map((size) => (
                        <button key={size} onClick={() => setCaptionSize(size)} className={`text-xs px-2 py-2 rounded-lg transition-all ${captionSize === size ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:bg-white/5'}`}>{size}</button>
                      ))}
                    </div>
                 </div>
              </div>
           </div>
        )}

      </div>
      
      {/* External Captions (Below Mode) */}
      {showCaptions && captionPos === CaptionPosition.BELOW && (
        <div className="absolute bottom-0 w-full bg-black border-t border-zinc-900 py-8 z-40 text-center px-4">
           <p className={`text-zinc-200 font-medium max-w-3xl mx-auto leading-relaxed animate-fade-in ${captionSize === FontSize.SMALL ? 'text-lg' : captionSize === FontSize.LARGE ? 'text-2xl' : 'text-xl'}`}>
            {currentScene.narration}
           </p>
        </div>
      )}
    </div>
  );
};

export default StoryPlayer;