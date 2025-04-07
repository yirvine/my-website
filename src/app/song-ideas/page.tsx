'use client'; // Required for useEffect and useState

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link'; // Import Link for navigation
import { FixedSizeList as List } from 'react-window'; // Import react-window

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

// --- React Window Row Component ---
// This component renders a single item in the virtualized list.
const Row = ({ index, style, data }: { index: number; style: React.CSSProperties; data: { demos: Demo[]; handlePlay: (e: React.SyntheticEvent<HTMLAudioElement, Event>) => void; handleEnded: (e: React.SyntheticEvent<HTMLAudioElement, Event>) => void } }) => {
    const { demos, handlePlay, handleEnded } = data;
    const demo = demos[index];

    // Important: Apply the style prop provided by react-window
    // It contains positioning information (top, left, width, height).
    return (
        <div style={style}>
            {/* Use padding within the row div instead of on the outer li */}
            <div className="p-4 border border-gray-700 rounded-lg shadow-sm bg-gray-900 h-full flex flex-col justify-between">
                <div> {/* Content container */}
                    <h2 className="text-xl font-mono font-semibold mb-2 truncate" title={cleanFileName(demo.fileName)}>
                        {cleanFileName(demo.fileName)}
                    </h2>
                    <p className="text-sm text-gray-400 mb-3">
                        exported {formatTimestamp(demo.timestamp)}
                    </p>
                    <div className="mb-3">
                        <audio
                            id={`audio-${demo.fileName}`}
                            controls
                            preload="metadata"
                            src={demo.relativePath}
                            onPlay={handlePlay}
                            onEnded={handleEnded}
                            className="w-full"
                        >
                            Your browser does not support the audio element.
                        </audio>
                    </div>
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
  const currentlyPlayingRef = useRef<HTMLAudioElement | null>(null); // Ref to store the playing audio element
  const containerRef = useRef<HTMLDivElement>(null); // Ref for the list container
  const [listHeight, setListHeight] = useState(600); // Default height, will update

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
  }, []); // Empty dependency array ensures this runs once on mount

  // Use useCallback for handlers passed to Rows to prevent unnecessary re-renders
  const handlePlay = useCallback((event: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const currentAudio = event.currentTarget;
    // If there's another audio playing and it's not the one that just started...
    if (currentlyPlayingRef.current && currentlyPlayingRef.current !== currentAudio) {
      currentlyPlayingRef.current.pause(); // Pause the previous one
    }
    // Update the ref to the currently playing audio
    currentlyPlayingRef.current = currentAudio;
  }, []);

  // Use useCallback for handlers passed to Rows to prevent unnecessary re-renders
  const handleEnded = useCallback((event: React.SyntheticEvent<HTMLAudioElement, Event>) => {
      const finishedAudio = event.currentTarget;
      const currentSrc = finishedAudio.currentSrc; // Get the full source URL

      // Find the index of the track that just ended
      const currentIndex = demos.findIndex(demo => currentSrc.endsWith(demo.relativePath));

      if (currentIndex === -1 || demos.length <= 1) {
          // Should not happen if src is correct, or only one demo
          currentlyPlayingRef.current = null; // Reset playing ref
          return;
      }

      // Calculate the index of the next track, wrap around
      const nextIndex = (currentIndex + 1) % demos.length;
      const nextDemo = demos[nextIndex];

      // Find the audio element for the next track using its ID
      // We derive the ID from the filename - ensure it's unique and valid
      const nextAudioId = `audio-${nextDemo.fileName}`;
      const nextAudio = document.getElementById(nextAudioId) as HTMLAudioElement | null;

      if (nextAudio) {
          nextAudio.play().catch(e => console.error("Error playing next audio:", e)); // Add catch for play promise
      } else {
          console.warn(`Could not find next audio element with ID: ${nextAudioId}`);
          currentlyPlayingRef.current = null; // Reset if next element not found
      }
  }, [demos]);

  // Estimated height per item - adjust this based on visual inspection!
  const itemSize = 190; // Increased slightly to ensure padding fits

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

      {/* List container - takes remaining height */}
      <div ref={containerRef} className="flex-grow max-w-7xl w-full mx-auto px-4 pb-8">
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
            itemData={{ demos, handlePlay, handleEnded }} // Pass necessary data and handlers to Row
          >
            {Row}
          </List>
        )}
      </div>
    </div>
  );
} 