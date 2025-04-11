'use client'; // Required for useEffect and useState

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link'; // Import Link for navigation
import { FixedSizeList as List } from 'react-window'; // Import react-window
import { Play, Pause, Volume2, VolumeX, SkipForward, Rewind, Undo2, Redo2 } from 'lucide-react'; // Import icons for play/pause and volume, and skip/rewind
import { Button } from "@/components/ui/button"; // Assuming you have Button component

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
            <div className={`p-4 pb-4 border rounded-lg shadow-sm h-full flex flex-col ${isActive ? 'border-yellow-400 bg-gray-800' : 'border-gray-700 bg-gray-900'}`}>
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

  // --- Updated handlePlayClick ---
  const handlePlayClick = useCallback((index: number) => {
     if (!audioRef.current || index < 0 || index >= demos.length) return;
     const demoToPlay = demos[index];

     if (currentPlayingIndex === index) {
       // Clicked on the currently playing track: Toggle pause/play
       if (isPlaying) {
         audioRef.current.pause();
       } else {
         audioRef.current.play().catch(e => console.error("Error resuming play:", e));
       }
     } else {
       // Clicked on a new track
       setCurrentPlayingIndex(index);
       audioRef.current.src = demoToPlay.relativePath;
       audioRef.current.load(); // Important: load the new source
       audioRef.current.play().catch(e => {
           console.error("Error playing new track:", e);
           // Ensure isPlaying is false if play fails - listener should handle this
           setIsPlaying(false);
       });
       setCurrentTime(0); // Reset time when loading new track
       setDuration(0); // Reset duration
     }
  }, [demos, currentPlayingIndex, isPlaying]);

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
    // Apply the main site layout classes
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Container for top content + sticky header */}
      <div className="max-w-7xl w-full mx-auto px-4 pt-8">
        {/* --- Sticky Header Div --- */}
        {/* Apply sticky, z-index, bg. Negative margins pull it edge-to-edge within padding, py adds vertical space */}
        <div className="sticky top-0 z-20 bg-black py-3 -mt-8 -mx-4 px-4 mb-4">
          {/* Keep existing link styles (font, hover, etc.) */}
          <Link href="/" className="text-1xl font-mono block hover:text-yellow-400 transition-colors duration-200">
            &larr; back to home
          </Link>
        </div>
        {/* --- End Sticky Header Div --- */}
        
        {/* Apply mono font to heading */}
        <h1 className="text-4xl font-mono mb-6">song_ideas.mp3</h1>
        <p className="text-gray-400 mb-8">song ideas synced from my dropbox, some rough, some refined</p>
      </div>

      {/* List container - takes remaining height */}
      <div ref={containerRef} className={`flex-grow max-w-7xl w-full mx-auto px-4 ${currentPlayingIndex !== null ? 'pb-0' : ''}`}> {/* Removed base padding, only add pb-16 when player is active */}
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
      {currentPlayingIndex !== null && demos[currentPlayingIndex] && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900 p-3 border-t border-gray-700 z-50 flex items-center gap-3 text-sm">
              {/* Restart Button */}
              <Button variant="ghost" size="icon" onClick={handleRestart} title="Restart track" className="text-white hover:bg-gray-700">
                  <Rewind className="h-5 w-5" />
              </Button>
              {/* --- Rewind 15s Button --- */}
              <Button variant="ghost" size="icon" onClick={handleSeekBackward} title="Rewind 15s" className="text-white hover:bg-gray-700">
                  <Undo2 className="h-5 w-5" />
              </Button>
              {/* Play/Pause Button */}
              <Button variant="ghost" size="icon" onClick={togglePlayPause} className="text-white hover:bg-gray-700">
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              {/* --- Skip 15s Button --- */}
              <Button variant="ghost" size="icon" onClick={handleSeekForward} title="Skip 15s" className="text-white hover:bg-gray-700">
                  <Redo2 className="h-5 w-5" />
              </Button>
              {/* Next Button */}
              <Button variant="ghost" size="icon" onClick={handleSkipNext} title="Next track" className="text-white hover:bg-gray-700">
                  <SkipForward className="h-5 w-5" />
              </Button>

              {/* Current Time */}
              <span className="font-mono text-gray-400 w-10 text-right">{formatTime(currentTime)}</span>

              {/* Seek Bar */}
              <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-grow h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-400"
              />

              {/* Duration */}
              <span className="font-mono text-gray-400 w-10 text-left">{formatTime(duration)}</span>

              {/* Volume Control */}
              <div className="flex items-center gap-2">
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

              {/* Track Title (optional, maybe for larger screens?) */}
               <p className="hidden md:block font-mono truncate flex-shrink-0 ml-4">
                 {cleanFileName(demos[currentPlayingIndex].fileName)}
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