'use client'; // Required for useEffect and useState

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link'; // Import Link for navigation
import { FixedSizeList as List } from 'react-window'; // Import react-window
import { Play, Pause, Volume2, VolumeX, SkipForward, Rewind, Undo2, Redo2 } from 'lucide-react'; // Import icons for play/pause and volume, and skip/rewind
import { Button } from "@/components/ui/button"; // Assuming you have Button component
import Aurora from '@/components/Aurora'; // Import the Aurora component
import WaveSurfer from 'wavesurfer.js'; // Import WaveSurfer

// Define an interface for the demo data structure
interface Demo {
  fileName: string;
  relativePath: string;
  timestamp: string; // ISO string format
}

// --- Control Flag --- 
const ENABLE_DOWNLOADS = false; // Set to true to re-enable downloads

// Helper function to format the timestamp (optional, but nice)
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.ceil(diffTime / (1000 * 60));

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays <= 7) {
     return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
     // Simple date format for older entries
     return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
}

// Basic function to clean up the filename for display
function cleanFileName(fileName: string): string {
    // Remove .mp3 extension
    let cleaned = fileName.replace(/\.mp3$/i, '');
    // Replace underscores/hyphens with spaces (optional)
    cleaned = cleaned.replace(/[_-]/g, ' ');
    // Add more cleaning rules if needed (e.g., for mood tags later)
    return cleaned;
}

// Helper to format time in seconds to MM:SS
const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// --- React Window Row Component ---
const Row = ({ index, style, data }: { index: number; style: React.CSSProperties; data: { demos: Demo[]; handlePlayClick: (index: number) => void; currentPlayingIndex: number | null; isPlaying: boolean; enableDownloads: boolean } }) => {
    const { demos, handlePlayClick, currentPlayingIndex, isPlaying, enableDownloads } = data;
    const demo = demos[index];
    const isActive = index === currentPlayingIndex;

    return (
        <div style={style}>
            <div 
                className={`p-4 pb-4 border rounded-lg shadow-sm h-full flex flex-col ${isActive ? 'border-yellow-400 bg-gray-800' : 'border-gray-700 bg-gray-900 hover:bg-gray-800'} opacity-75 transition-colors duration-200 cursor-pointer`}
                onClick={() => handlePlayClick(index)}
            >
                {/* Top section: Title and Timestamp */}
                <div>
                    <h2 className="text-xl font-mono font-semibold mb-2 truncate" title={cleanFileName(demo.fileName)}>
                        {cleanFileName(demo.fileName)}
                    </h2>
                     {/* Reduced margin-bottom */}
                    <p className="text-sm text-gray-400 mb-2">
                        exported {formatTimestamp(demo.timestamp)}
                    </p>
                 </div>

                 {/* Controls section: Removed mt-2 */}
                <div className="flex items-center gap-3">
                    {/* Play/Pause Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePlayClick(index)}
                        className="text-white hover:bg-gray-700 p-1.5"
                    >
                        {isActive && isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                         {/* Added span for styling */}
                        <span className="lowercase font-mono">
                             {isActive && isPlaying ? 'Pause' : 'Play'}
                        </span>
                    </Button>

                    {/* Conditionally render the Download Link based on the flag */}
                    {enableDownloads && (
                         <a
                            href={demo.relativePath}
                            download={demo.fileName}
                            className="text-blue-400 hover:underline font-mono text-sm p-1.5"
                         >
                            download mp3
                         </a>
                    )}
                </div>
            </div>
        </div>
    );
};
// --- End React Window Row Component ---

// Define the colors outside the component for stable reference
const auroraColorStops = ["#00D8FF", "#7CFF67", "#00D8FF"];

export default function SongIdeasPage() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null); // Ref for the SINGLE audio player
  const containerRef = useRef<HTMLDivElement>(null); // Ref for the list container
  const [listHeight, setListHeight] = useState(600); // Default height, will update
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(null); // Track index instead of element
  const [isPlaying, setIsPlaying] = useState<boolean>(false); // Track playing state
  // New state for player UI
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  // Ref for throttling time updates
  const timeUpdateThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null); // Ref for WaveSurfer container
  const wavesurferInstanceRef = useRef<WaveSurfer | null>(null); // Ref for WaveSurfer instance
  // Mobile Detection State
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [isFadingWaveform, setIsFadingWaveform] = useState<boolean>(false); // State for fade effect
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref to manage fade timeout

  // Update list height based on container size
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        // Simple approach: Calculate based on viewport height minus estimated header/padding
        // Adjust the '150' based on your actual layout above the list
        const calculatedHeight = window.innerHeight - (containerRef.current.offsetTop || 150);
        setListHeight(Math.max(200, calculatedHeight)); // Ensure minimum height
      }
    };
    updateHeight(); // Initial calculation
    window.addEventListener('resize', updateHeight); // Update on resize
    return () => window.removeEventListener('resize', updateHeight); // Cleanup listener
  }, [isLoading]); // Recalculate if loading state changes (layout might shift)

  useEffect(() => {
    // Fetch the demo data from the JSON file generated by the sync script
    fetch('/demos.json')
      .then(response => response.ok ? response.json() : Promise.reject(response))
      .then((data: Demo[]) => {
        setDemos(data);
        setIsLoading(false);
      })
      .catch(async err => {
        const statusText = await err.statusText || 'Fetch Error';
        const status = err.status || 'N/A';
        console.error("Error fetching or parsing demos.json:", statusText);
        if (status === 404) {
             setError("Demo list not found. Run 'npm run sync-demos' locally, then commit and push the results.");
        } else {
            setError(`An error occurred fetching demo data: ${statusText} (Status: ${status})`);
        }
        setIsLoading(false);
      });
  }, []);

  // --- Mobile Detection Effect ---
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 640px)").matches); // Tailwind 'sm' breakpoint
    };
    checkMobile();
  }, []);

  // --- Play Click Handler (Implement Fade Out, Always attempt play) ---
  const handlePlayClick = useCallback((index: number) => {
    const currentAudio = audioRef.current;
    if (!currentAudio || index < 0 || index >= demos.length) return;

    const demoToPlay = demos[index];

    // Clear any pending fade-out timeout if user clicks rapidly
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }

    if (currentPlayingIndex === index) {
       // Toggle play/pause for the current track
       setIsFadingWaveform(false); // Ensure fade is off
       if (isPlaying) {
           currentAudio.pause();
       } else {
           currentAudio.play().catch(e => console.error("Error resuming play:", e));
       }
    } else {
      // --- Load and Play New Track, Start Fade Out ---
      console.log(`Loading track: ${demoToPlay.relativePath}`);
      // REMOVED: const wasPlaying = isPlaying;

      setCurrentPlayingIndex(index);
      setCurrentTime(0);
      setDuration(0);

      // Set src and load audio immediately
      currentAudio.src = demoToPlay.relativePath;
      currentAudio.load();

      // ALWAYS Attempt to play immediately after load
      currentAudio.play().then(() => {
           console.log("Immediate play() successful (or resolved).");
           // Optimistically set playing state (native 'play' event will also fire)
           setIsPlaying(true);
      }).catch(e => {
           // Ignore interruption errors, likely handled by subsequent events or plays
           if (e.name !== 'AbortError') {
               console.error("Error on immediate play():", e);
           } else {
               console.log("Immediate play() AbortError caught (likely okay).");
           }
      });
      // REMOVED: else { setIsPlaying(false); } block

      // If WaveSurfer exists (desktop), START FADE OUT, then load after delay
      if (wavesurferInstanceRef.current && isMobile === false) {
         console.log("[WaveSurfer] Starting fade out...");
         setIsFadingWaveform(true); // Trigger fade out CSS

         // Set timeout to load AFTER fade animation
         fadeTimeoutRef.current = setTimeout(() => {
             console.log("[WaveSurfer] Fade out complete, loading new media...");
             if (wavesurferInstanceRef.current && audioRef.current) {
                 try {
                     wavesurferInstanceRef.current.load(audioRef.current.src);
                 } catch (error) { /* ... error handling ... */ }
             } else { /* ... error handling ... */ }
             fadeTimeoutRef.current = null;
         }, 500);

      } else if (isMobile === false) {
         // If on desktop but WS not initialized, just ensure fade is off
         setIsFadingWaveform(false);
      }
    }
  }, [demos, currentPlayingIndex, isPlaying, isMobile]); // Dependencies

  // Effect to setup audio player listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // --- Event Handlers --- 
    const handleAudioPlay = () => {
      setIsPlaying(true);
      // *** Preload next track logic ***
      if (demos.length > 1 && currentPlayingIndex !== null) {
        const nextIndex = (currentPlayingIndex + 1) % demos.length;
        const nextDemo = demos[nextIndex];
        if (nextDemo) {
          console.log(`[Player] Play started for index ${currentPlayingIndex}. Preloading next track (index ${nextIndex}): ${nextDemo.fileName}`);
          const preloader = new Audio();
          preloader.src = nextDemo.relativePath;
          preloader.load(); // Hint browser to start loading
          // No need to attach or play the preloader
        }
      }
    };
    const handleAudioPause = () => setIsPlaying(false);
    const handleAudioEnded = () => { // Autoplay next logic
        if (currentPlayingIndex === null || demos.length <= 1) return;
        const nextIndex = (currentPlayingIndex + 1) % demos.length;
        handlePlayClick(nextIndex); 
    };
    const handleLoadedMetadata = () => setDuration(audio.duration);
    
    // Restore throttled time update handler
    const handleTimeUpdate = () => {
      if (timeUpdateThrottleRef.current) {
          return;
      }
      timeUpdateThrottleRef.current = setTimeout(() => {
          if (audioRef.current) {
             setCurrentTime(audioRef.current.currentTime);
          }
          timeUpdateThrottleRef.current = null; 
      }, 250); 
    };
    
    // Restore volume change handler
    const handleVolumeChange = () => {
      if (audioRef.current) {
          setVolume(audioRef.current.volume);
          setIsMuted(audioRef.current.muted);
      }
    };

    // --- Add Listeners --- 
    audio.addEventListener('play', handleAudioPlay);
    audio.addEventListener('pause', handleAudioPause);
    audio.addEventListener('ended', handleAudioEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('volumechange', handleVolumeChange);

    // --- Initial Sync Logic (Restore) ---
    setVolume(audio.volume);
    setIsMuted(audio.muted);
    if(!isNaN(audio.duration)) { 
        setDuration(audio.duration);
        setCurrentTime(audio.currentTime);
    }

    // --- Cleanup Listeners --- 
    return () => {
      audio.removeEventListener('play', handleAudioPlay);
      audio.removeEventListener('pause', handleAudioPause);
      audio.removeEventListener('ended', handleAudioEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('volumechange', handleVolumeChange);
      // Restore timeout clearance
      if (timeUpdateThrottleRef.current) {
          clearTimeout(timeUpdateThrottleRef.current);
          timeUpdateThrottleRef.current = null;
      }
    };
  }, [currentPlayingIndex, demos, handlePlayClick]); 

  // --- WaveSurfer Initialization/Load Effect (Desktop Only) ---
  useEffect(() => {
    if (typeof window === 'undefined' || isMobile === null) return;
    const currentAudio = audioRef.current;
    const currentWaveformContainer = waveformRef.current;
    if (isMobile) {
        // Cleanup on mobile
        if (wavesurferInstanceRef.current) {
            wavesurferInstanceRef.current.destroy();
            wavesurferInstanceRef.current = null;
        }
        return;
    }

    // --- Desktop Logic ---
    if (!currentAudio || !currentWaveformContainer) return;

    // Initialize WaveSurfer if it doesn't exist for desktop
    if (!wavesurferInstanceRef.current) {
        console.log("[WaveSurfer Effect] Initializing NEW instance for Desktop...");
        const ws = WaveSurfer.create({
          container: currentWaveformContainer,
          media: currentAudio,
          waveColor: '#6B7280',    // gray-500
          progressColor: '#FBBF24', // yellow-400
          height: 70,             // Adjust height as needed
          barWidth: 3,
          barGap: 2,
          cursorWidth: 0,           // Hide default cursor/playhead
          interact: true,           // Allow seeking by clicking waveform
          autoCenter: true,
          normalize: true,          // Normalize waveform heights
        });

        ws.on('ready', (durationValue) => {
            console.log("[WaveSurfer] Ready.", durationValue);
            setDuration(durationValue);
            setIsFadingWaveform(false); // Trigger fade IN
        });

        ws.on('audioprocess', (currentTimeValue) => setCurrentTime(currentTimeValue));
        ws.on('seeking', (currentTimeValue) => setCurrentTime(currentTimeValue));
        ws.on('error', (error) => {
             console.error('[WaveSurfer] Error:', error);
             setIsFadingWaveform(false); // Ensure fade is off on error
        });
        ws.on('finish', () => { /* ... unchanged (play next) ... */ });

        wavesurferInstanceRef.current = ws;

        // If a track is already selected and loaded in audioRef, load it into WS
        if (currentAudio.src && currentPlayingIndex !== null) {
             console.log("[WS Effect] Loading initial media:", currentAudio.src);
              // Don't fade initially, just load
             setIsFadingWaveform(false);
             ws.load(currentAudio.src).catch(e => {
                 console.error("WS initial load error:", e);
             });
        } else {
            setIsFadingWaveform(false); // Ensure fade is off if no initial track
        }
    }

    // Cleanup only when switching to mobile or unmounting main component
    return () => {
        // Destroy only if the component unmounts while on desktop
        if (isMobile === false) {
             console.log("[WaveSurfer Effect] Cleanup running (Desktop). Instance will persist unless unmounting.");
             // Maybe don't destroy here? Let the mobile switch handle it.
        }
        // If component unmounts, destroy instance regardless
        // This requires a different pattern, maybe a top-level effect cleanup
    };

  }, [isMobile, currentPlayingIndex]); // Only run when isMobile changes OR on initial mount

  // Separate effect for destroying WS on unmount
   useEffect(() => {
       // Return cleanup function that captures the instance ref
       const wsRef = wavesurferInstanceRef;
       return () => {
           console.log("Component unmounting, destroying WaveSurfer if it exists.");
           if (wsRef.current) {
               wsRef.current.destroy();
               wsRef.current = null;
           }
       };
   }, []); // Empty array ensures this runs only on unmount

  // Cleanup fade timeout on unmount
  useEffect(() => {
      const timeoutRef = fadeTimeoutRef;
      return () => {
          if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
          }
      };
  }, []);

  // Adjusted item size again
  const itemSize = 120;

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!audioRef.current) return;
      const newTime = parseFloat(event.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
  };

  const handleVolume = (event: React.ChangeEvent<HTMLInputElement>) => {
       if (!audioRef.current) return;
       const newVolume = parseFloat(event.target.value);
       audioRef.current.volume = newVolume;
       setVolume(newVolume);
       if (newVolume > 0 && audioRef.current.muted) {
           audioRef.current.muted = false;
           setIsMuted(false);
       }
  };

  const toggleMute = () => {
       if (!audioRef.current) return;
       const currentlyMuted = !audioRef.current.muted;
       audioRef.current.muted = currentlyMuted;
       setIsMuted(currentlyMuted);
       if (!currentlyMuted && audioRef.current.volume === 0) {
            audioRef.current.volume = 0.5;
       }
  };

  const togglePlayPause = () => {
       if (!audioRef.current || currentPlayingIndex === null) return;
       if (isPlaying) {
           audioRef.current.pause();
       } else {
           audioRef.current.play().catch(e => console.error("Error toggling play:", e));
       }
  };

  const handleRestart = () => {
      if (audioRef.current) {
          audioRef.current.currentTime = 0;
      }
  };

  const handleSkipNext = () => {
      if (currentPlayingIndex === null || demos.length === 0) return;
      const nextIndex = (currentPlayingIndex + 1) % demos.length;
      handlePlayClick(nextIndex);
  };

  // New Handler: Seek Backward 15 seconds
  const handleSeekBackward = () => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, audioRef.current.currentTime - 15);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime); // Update UI immediately
  };

  // New Handler: Seek Forward 15 seconds
  const handleSeekForward = () => {
    if (!audioRef.current || isNaN(audioRef.current.duration)) return;
    const newTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 15);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime); // Update UI immediately
  };

  return (
    // Apply the main site layout classes and make it relative for absolute positioning of children
    <div className="min-h-screen bg-black text-white flex flex-col relative">
      {/* Aurora Background */}
      <Aurora
        className="absolute inset-0 z-0 opacity-30" // Positioned behind content, adjust opacity as needed
        colorStops={auroraColorStops} // Use the stable variable
        blend={0.5}
        amplitude={1.0}
        speed={0.5}
      />

      {/* Container for top content + sticky header - Make content relative and give z-index to ensure it's above aurora */}
      <div className="max-w-7xl w-full mx-auto px-4 pt-8 relative z-10">
        {/* --- Sticky Header Div --- */}
        {/* Apply sticky, z-index. Negative margins pull it edge-to-edge within padding, py adds vertical space */}
        {/* REMOVED bg-black to make it transparent */}
        <div className="sticky top-0 z-20 py-3 -mt-8 -mx-4 px-4 mb-4">
          {/* Keep existing link styles (font, hover, etc.) */}
          <Link href="/" className="text-1xl font-mono block hover:text-yellow-400 transition-colors duration-200">
            &larr; back to home
          </Link>
        </div>
        {/* --- End Sticky Header Div --- */}
        
        {/* Apply mono font to heading */}
        <h1 className="text-4xl font-mono mb-6">song_ideas.mp3</h1>
        <p className="mb-8 font-mono text-gray-300">song ideas synced from my dropbox, some rough, some refined</p>
      </div>

      {/* List container - takes remaining height - Make content relative and give z-index */}
      <div ref={containerRef} className={`flex-grow max-w-7xl w-full mx-auto px-4 ${currentPlayingIndex !== null ? 'pb-0' : ''} relative z-10`}> {/* Add relative z-10 */}
        {/* Loading/Error/No Demos messages will inherit text-white */}
        {isLoading && <p>Loading latest demos...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!isLoading && !error && demos.length === 0 && (
            <p>No demos found. Run <code className="bg-gray-700 px-1 py-0.5 rounded text-sm">npm run sync-demos</code> locally, then commit & push.</p>
        )}

        {!isLoading && !error && demos.length > 0 && (
          <List
            height={listHeight} // Use dynamic height
            itemCount={demos.length}
            itemSize={itemSize} // Pass estimated item height
            width="100%" // Take full width of container
            itemData={{ demos, handlePlayClick, currentPlayingIndex, isPlaying, enableDownloads: ENABLE_DOWNLOADS }} // Pass necessary data and handlers to Row
            overscanCount={5} // Render more items above/below viewport
          >
            {Row}
          </List>
        )}
      </div>

      {/* --- Enhanced Bottom Player Bar --- */}
      {/* Ensure player bar is above the background (already has z-50) */}
      {currentPlayingIndex !== null && demos[currentPlayingIndex] && (
          // Refactor for responsive layout: flex-col default, sm:flex-row
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3 border-t border-gray-700 z-50 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm">

              {/* --- Waveform (Desktop) OR Seek Bar (Mobile) --- */}
              {isMobile === false && (
                  <div
                      ref={waveformRef}
                      // Add transition and conditional opacity classes
                      className={`w-full order-1 sm:order-2 sm:flex-grow h-[70px] cursor-pointer relative transition-opacity duration-500 ease-in-out ${
                          isFadingWaveform ? 'opacity-0' : 'opacity-100'
                      }`}
                  >
                      {/* WaveSurfer will render here */}
                  </div>
              )}
              {isMobile === true && (
                   <div className="flex items-center w-full gap-2 sm:gap-3 order-1 sm:order-2 sm:flex-grow">
                       <span className="font-mono text-gray-400 w-10 text-right">{formatTime(currentTime)}</span>
                       <input
                          type="range"
                          min="0"
                          max={duration || 0}
                          value={currentTime}
                          onChange={handleSeek}
                          className="flex-grow h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-400"
                       />
                       <span className="font-mono text-gray-400 w-10 text-left">{formatTime(duration)}</span>
                   </div>
              )}

              {/* --- Control Buttons Group (Order 2 mobile, Order 1 desktop) --- */}
              <div className="flex justify-center items-center gap-1 sm:gap-1 order-2 sm:order-1">
                  {/* Restart Button - Add focus-visible:ring-0 and !important */} 
                  <Button variant="ghost" onClick={handleRestart} title="Restart track" className="text-white hover:bg-gray-700 p-2 focus:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 active:!bg-transparent"> 
                      <Rewind className="h-8 w-8" /> 
                  </Button>
                  {/* --- Rewind 15s Button - Add focus-visible:ring-0 and !important --- */}
                  <Button variant="ghost" onClick={handleSeekBackward} title="Rewind 15s" className="text-white hover:bg-gray-700 p-2 focus:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 active:!bg-transparent"> 
                      <Undo2 className="h-8 w-8" />
                  </Button>
                  {/* Play/Pause Button - Add focus-visible:ring-0 and !important */} 
                  <Button variant="ghost" onClick={togglePlayPause} className="text-white hover:bg-gray-700 p-2 focus:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 active:!bg-transparent"> 
                      {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />} 
                  </Button>
                  {/* --- Skip 15s Button - Add focus-visible:ring-0 and !important --- */} 
                  <Button variant="ghost" onClick={handleSeekForward} title="Skip 15s" className="text-white hover:bg-gray-700 p-2 focus:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 active:!bg-transparent"> 
                      <Redo2 className="h-8 w-8" /> 
                  </Button>
                  {/* Next Button - Add focus-visible:ring-0 and !important */} 
                  <Button variant="ghost" onClick={handleSkipNext} title="Next track" className="text-white hover:bg-gray-700 p-2 focus:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 active:!bg-transparent"> 
                      <SkipForward className="h-8 w-8" />
                  </Button>
              </div>

              {/* --- Mobile Volume Control (Order 3 mobile, hidden desktop) --- */}
              <div className="flex justify-center items-center gap-2 w-full order-3 sm:hidden">
                   <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-gray-700">
                      {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                   </Button>
                   <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolume}
                      // Use w-1/2 for narrower mobile volume slider
                      className="w-1/2 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-400"
                   />
              </div>

              {/* --- Desktop Volume Control (hidden mobile, Order 3 desktop) --- */}
              <div className="hidden sm:flex items-center gap-2 order-3">
                   <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-gray-700">
                      {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                   </Button>
                  <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolume}
                      className="w-20 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-400"
                  />
              </div>

              {/* --- Track Title (Fixed Width, Truncated) --- */}
               <p className="hidden md:block font-mono text-gray-400 ml-4 order-4 w-48 overflow-hidden truncate">
                 {currentPlayingIndex !== null ? cleanFileName(demos[currentPlayingIndex].fileName) : ''}
               </p>

          </div>
      )}
      {/* --- End Bottom Player Bar --- */}

      {/* Hidden audio element for playback - Keep preload="metadata" */}
      <audio ref={audioRef} preload="metadata" className="hidden">
            Your browser doesn&apos;t support embedded audio.
      </audio>
    </div>
  );
} 