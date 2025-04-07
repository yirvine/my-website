'use client'; // Required for useEffect and useState

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link'; // Import Link for navigation
import { FixedSizeList as List } from 'react-window'; // Import react-window
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'; // Import icons for play/pause and volume
import { Button } from "@/components/ui/button"; // Assuming you have Button component

// Define an interface for the demo data structure
interface Demo {
  fileName: string;
  relativePath: string;
  timestamp: string; // ISO string format
}

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
// This component renders a single item in the virtualized list.
const Row = ({ index, style, data }: { index: number; style: React.CSSProperties; data: { demos: Demo[]; handlePlayClick: (index: number) => void; currentPlayingIndex: number | null; isPlaying: boolean } }) => {
    const { demos, handlePlayClick, currentPlayingIndex, isPlaying } = data;
    const demo = demos[index];
    const isActive = index === currentPlayingIndex;

    // Important: Apply the style prop provided by react-window
    // It contains positioning information (top, left, width, height).
    return (
        <div style={style}>
            {/* Use padding within the row div instead of on the outer li */}
            <div className={`p-4 border rounded-lg shadow-sm h-full flex flex-col justify-between ${isActive ? 'border-yellow-400 bg-gray-800' : 'border-gray-700 bg-gray-900'}`}> {/* Highlight active */}
                <div> {/* Content container */}
                    <h2 className="text-xl font-mono font-semibold mb-2 truncate" title={cleanFileName(demo.fileName)}>
                        {cleanFileName(demo.fileName)}
                    </h2>
                    <p className="text-sm text-gray-400 mb-3">
                        exported {formatTimestamp(demo.timestamp)}
                    </p>
                    {/* Play/Pause Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePlayClick(index)}
                        className="mb-3 text-white hover:bg-gray-700"
                    >
                        {isActive && isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                        {isActive && isPlaying ? 'Pause' : 'Play'}
                    </Button>
                </div>
                <div> {/* Download link container */}
                    <a
                        href={demo.relativePath}
                        download={demo.fileName}
                        className="text-blue-400 hover:underline font-mono text-sm mt-auto" // Ensure link stays at bottom if needed
                    >
                        download mp3
                    </a>
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
      .then(response => {
        if (!response.ok) {
          // Handle HTTP errors (like 404 Not Found if the file doesn't exist)
          throw new Error(`Failed to fetch demos.json: ${response.statusText} (Status: ${response.status})`);
        }
        return response.json();
      })
      .then((data: Demo[]) => {
        setDemos(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching or parsing demos.json:", err);
        // Check if the error message indicates a 404 or similar
        if (err.message.includes('404')) {
             setError("Demo list not found. Run 'npm run sync-demos' locally, then commit and push the results.");
        } else {
            setError(`An error occurred fetching demo data: ${err.message}`);
        }
        setIsLoading(false);
      });
  }, []);

  // --- Updated handlePlayClick ---
  const handlePlayClick = useCallback((index: number) => {
     if (!audioRef.current || index >= demos.length) return; // Safety checks

     const demoToPlay = demos[index];

     if (currentPlayingIndex === index) {
       // Clicked on the currently playing track: Toggle pause/play
       if (isPlaying) {
         audioRef.current.pause();
       } else {
         audioRef.current.play().catch(e => console.error("Error resuming play:", e));
       }
       // setIsPlaying(!isPlaying); // State update handled by listeners
     } else {
       // Clicked on a new track
       setCurrentPlayingIndex(index);
       audioRef.current.src = demoToPlay.relativePath;
       audioRef.current.load(); // Important: load the new source
       audioRef.current.play().catch(e => {
           console.error("Error playing new track:", e);
           // setIsPlaying(false); // State update handled by listeners
           setCurrentPlayingIndex(null); // Optionally reset index on error
       });
       setCurrentTime(0); // Reset time when loading new track
       setDuration(0); // Reset duration
     }
  }, [demos, currentPlayingIndex, isPlaying]); // Dependencies

  // Effect to setup audio player listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleAudioPlay = () => setIsPlaying(true);
    const handleAudioPause = () => setIsPlaying(false);
    const handleAudioEnded = () => { // Autoplay next logic
        if (currentPlayingIndex === null || demos.length <= 1) return;
        const nextIndex = (currentPlayingIndex + 1) % demos.length;
        handlePlayClick(nextIndex); // Use the same function to play next
    };
    // Listeners for UI updates
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleVolumeChange = () => {
        setVolume(audio.volume);
        setIsMuted(audio.muted);
    };

    audio.addEventListener('play', handleAudioPlay);
    audio.addEventListener('pause', handleAudioPause);
    audio.addEventListener('ended', handleAudioEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('volumechange', handleVolumeChange);

    // Initial sync in case volume changed before listeners attached
    setVolume(audio.volume);
    setIsMuted(audio.muted);

    // Cleanup listeners
    return () => {
      audio.removeEventListener('play', handleAudioPlay);
      audio.removeEventListener('pause', handleAudioPause);
      audio.removeEventListener('ended', handleAudioEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('volumechange', handleVolumeChange);
    };
    // Keep handlePlayClick dependency as the effect uses it
  }, [currentPlayingIndex, demos, handlePlayClick]);

  // Estimated height per item - adjust this based on visual inspection!
  const itemSize = 110; // Recalculate based on new layout (likely shorter without player)

  return (
    // Apply the main site layout classes
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="max-w-7xl w-full mx-auto px-4 pt-8">
        {/* Add back link */}
        <Link href="/" className="text-1xl font-mono mb-4 block hover:text-yellow-400 transition-colors duration-200">
          &larr; back to home
        </Link>
        {/* Apply mono font to heading */}
        <h1 className="text-4xl font-mono mb-6">song_ideas.mp3</h1>
        <p className="text-gray-400 mb-8">straight from dropbox, some rough, some refined</p>
      </div>

      {/* Single Audio Player (can be hidden or styled minimally) */}
      {/* Ensure audio tag has controls for debugging, can be removed later */}
      <audio ref={audioRef} controls preload="metadata" className="w-full fixed bottom-0 left-0 p-2 bg-gray-800 z-50 md:hidden">
            Your browser doesn&apos;t support embedded audio. {/* Escaped apostrophe */}
      </audio>
      {/* Optional: Display current track info somewhere */}
      {currentPlayingIndex !== null && demos[currentPlayingIndex] && (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 left-0 right-0 bg-gray-800 p-2 text-center z-40 border-t border-gray-700">
           <p className="text-sm font-mono truncate">
              Now Playing: {cleanFileName(demos[currentPlayingIndex].fileName)}
           </p>
           {/* Could add basic controls here linked to audioRef */}
        </div>
      )}

      {/* List container - takes remaining height */}
      <div ref={containerRef} className={`flex-grow max-w-7xl w-full mx-auto px-4 pb-8 ${currentPlayingIndex !== null ? 'pb-24 md:pb-16' : ''}`}> {/* Increased padding */}
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
            itemData={{ demos, handlePlayClick, currentPlayingIndex, isPlaying }} // Pass necessary data and handlers to Row
            overscanCount={5} // Render more items above/below viewport
          >
            {Row}
          </List>
        )}
      </div>

      {/* --- Enhanced Bottom Player Bar --- */}
      {currentPlayingIndex !== null && demos[currentPlayingIndex] && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900 p-3 border-t border-gray-700 z-50 flex items-center gap-4 text-sm">
              {/* Play/Pause Button */}
              <Button variant="ghost" size="icon" onClick={() => {
                  if (isPlaying) {
                      audioRef.current?.pause();
                  } else {
                      audioRef.current?.play().catch(e => console.error("Error toggling play:", e));
                  }
              }} className="text-white hover:bg-gray-700">
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>

              {/* Current Time */}
              <span className="font-mono text-gray-400 w-10 text-right">{formatTime(currentTime)}</span>

              {/* Seek Bar */}
              <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={(e) => {
                      if (audioRef.current) {
                          const newTime = parseFloat(e.target.value);
                          audioRef.current.currentTime = newTime;
                          setCurrentTime(newTime); // Update state immediately for smoother UI
                      }
                  }}
                  className="flex-grow h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-400" // Basic styling, can be improved
              />

              {/* Duration */}
              <span className="font-mono text-gray-400 w-10 text-left">{formatTime(duration)}</span>

              {/* Volume Control */}
              <div className="flex items-center gap-2">
                   <Button variant="ghost" size="icon" onClick={() => {
                       if (audioRef.current) {
                           const currentlyMuted = !audioRef.current.muted;
                           audioRef.current.muted = currentlyMuted;
                           setIsMuted(currentlyMuted);
                           // If unmuting and volume was 0, set a default volume
                           if (!currentlyMuted && audioRef.current.volume === 0) {
                                audioRef.current.volume = 0.5; // Or restore previous volume if stored
                           }
                       }
                   }} className="text-white hover:bg-gray-700">
                      {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                   </Button>
                  <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                          if (audioRef.current) {
                              const newVolume = parseFloat(e.target.value);
                              audioRef.current.volume = newVolume;
                              setVolume(newVolume); // Update state
                              // Unmute if volume is adjusted while muted
                              if (newVolume > 0 && audioRef.current.muted) {
                                  audioRef.current.muted = false;
                                  setIsMuted(false);
                              }
                          }
                      }}
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

      {/* Hidden audio element for playback */}
      <audio ref={audioRef} preload="metadata" className="hidden">
            Your browser doesn&apos;t support embedded audio.
      </audio>
    </div>
  );
} 