'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // For album art

// Define an interface for the processed track data
interface ProcessedTrack {
  id: string;
  name: string;
  artists: string;
  albumImageUrl?: string; // Optional
  trackUrl?: string;    // Optional
  popularity?: number;  // Optional
}

export default function ListeningPage() {
  const [tracks, setTracks] = useState<ProcessedTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true; // Flag to prevent state update on unmounted component
    setIsLoading(true); // Ensure loading is true at the start
    setError(null); // Reset error

    fetch('/top-tracks.json') // Fetch the new file
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch top-tracks.json: ${response.statusText} (Status: ${response.status})`);
        }
        return response.json();
      })
      .then((fetchedData: ProcessedTrack[]) => {
         if (isMounted) {
            if (Array.isArray(fetchedData) && fetchedData.length > 0) {
                setTracks(fetchedData);
            } else {
                // If fetch was ok but data is empty array, consider it an issue
                setError("Top tracks data is empty. The sync might have failed during the last build.");
                setTracks([]); // Ensure tracks is empty array
            }
         }
      })
      .catch(err => {
        console.error("Error fetching or parsing top-tracks.json:", err);
        if (isMounted) {
           // Handle 404 or other fetch errors
             setError(`Error fetching top tracks: ${err.message}. The sync might have failed.`);
             setTracks([]); // Ensure tracks is empty array on error
        }
      })
      .finally(() => {
         if (isMounted) {
             setIsLoading(false);
         }
      });

      // Cleanup function
      return () => {
          isMounted = false;
      };
  }, []); // Empty dependency array

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/" className="text-1xl font-mono mb-4 block hover:text-yellow-400 transition-colors duration-200">
          &larr; back to home
        </Link>
        <h1 className="text-4xl font-mono mb-2">Listening Lately</h1>
         <p className="text-gray-400 mb-8 text-sm">My top 10 tracks on Spotify (last 6 months or so)</p>

        {isLoading && <p>Loading top tracks...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!isLoading && !error && tracks.length === 0 && (
           <p>No top tracks data found. The sync might have failed during the last build.</p>
        )}

        {!isLoading && !error && tracks.length > 0 && (
          <ol className="space-y-4 list-decimal list-inside font-mono">
            {tracks.map((track, index) => (
              <li key={track.id} className="border-b border-gray-800 pb-4 last:border-b-0">
                <a
                  href={track.trackUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 hover:bg-gray-800 p-2 rounded transition-colors duration-150"
                >
                  <span className="text-gray-500 w-6 text-right">{index + 1}.</span>
                  {track.albumImageUrl ? (
                    <Image
                      src={track.albumImageUrl}
                      alt={`Album art for ${track.name}`}
                      width={48} // Small size
                      height={48}
                      className="rounded shadow-sm flex-shrink-0"
                    />
                  ) : (
                     <div className="w-12 h-12 bg-gray-700 rounded flex-shrink-0"></div> // Placeholder
                  )}
                  <div className="flex-grow overflow-hidden">
                    <p className="text-white font-semibold truncate" title={track.name}>
                      {track.name}
                    </p>
                    <p className="text-gray-400 text-sm truncate" title={track.artists}>
                      {track.artists}
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
} 