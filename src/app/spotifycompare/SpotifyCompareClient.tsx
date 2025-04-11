'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Interfaces
interface UserProfile {
  displayName?: string;
  id?: string;
  email?: string;
}
interface Track {
  id: string;
  name: string;
  artists: string;
  albumImageUrl?: string;
  spotifyUrl?: string;
}

// Helper function to shuffle an array (Fisher-Yates) remains the same...
function shuffleArray<T>(array: T[]): T[] {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
  }


// Define structure for a comparison pair
interface ComparisonPair { // Renamed interface
  trackA: Track;
  trackB: Track;
}

// Component containing all the client-side logic
export default function SpotifyCompareClient() { // Renamed component
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [/* user */, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [/* spotifyToken */, setSpotifyToken] = useState<string | null>(null);

  // --- Comparison State ---
  const [isComparisonActive, setIsComparisonActive] = useState(false); // Renamed state
  const [comparisonPairs, setComparisonPairs] = useState<ComparisonPair[]>([]); // Renamed state
  const [currentPairIndex, setCurrentPairIndex] = useState(0); // Renamed state
  const [comparisonCompleted, setComparisonCompleted] = useState(false); // Renamed state
  // --- Feedback State ---
  // Removed isCorrect from feedback state
  const [answerFeedback, setAnswerFeedback] = useState<{ chosenId: string; correctId: string; } | null>(null);
  const [isShowingFeedback, setIsShowingFeedback] = useState(false);
  // --- Score State Removed ---

  // Ref to track if initial auth redirect has been processed
  const hasProcessedAuthRef = useRef(false);

  // --- DEFINE COMPARISON LOGIC ---
  const startComparison = useCallback((tracks: Track[]) => { // Renamed function
    console.log("DEBUG: startComparison function called.");
    // Score Resets Removed

    if (tracks.length < 10) {
        console.error("Not enough tracks for comparison structure (need 10).");
        setTrackError("Not enough track data to start the comparison.");
        setIsComparisonActive(false); // Renamed state
        setComparisonCompleted(true); // Renamed state
        return;
    }

    const track1 = tracks[0];
    const track2 = tracks[1];
    const remainingTracks = tracks.slice(2);
    const shuffledRemaining = shuffleArray([...remainingTracks]);

    const ARTIST_TRUNCATE_LENGTH = 30;

    const selectedRemaining = shuffledRemaining.slice(0, 8);

    const firstFourPairs: ComparisonPair[] = []; // Renamed variable
    for (let i = 0; i < 8; i += 2) {
        const trackA_orig = selectedRemaining[i];
        const trackB_orig = selectedRemaining[i+1];
        firstFourPairs.push({ // Renamed variable
            trackA: {
                ...trackA_orig,
                artists: trackA_orig.artists.length > ARTIST_TRUNCATE_LENGTH
                    ? trackA_orig.artists.substring(0, ARTIST_TRUNCATE_LENGTH) + '...'
                    : trackA_orig.artists
            },
            trackB: {
                ...trackB_orig,
                artists: trackB_orig.artists.length > ARTIST_TRUNCATE_LENGTH
                    ? trackB_orig.artists.substring(0, ARTIST_TRUNCATE_LENGTH) + '...'
                    : trackB_orig.artists
            }
        });
    }

    const finalComparisonTracks = Math.random() < 0.5 ? [track1, track2] : [track2, track1];
    const finalP_trackA_orig = finalComparisonTracks[0]; // Renamed variable
    const finalP_trackB_orig = finalComparisonTracks[1]; // Renamed variable

    const finalPair: ComparisonPair = { // Renamed variable
        trackA: {
            ...finalP_trackA_orig, // Renamed variable
            artists: finalP_trackA_orig.artists.length > ARTIST_TRUNCATE_LENGTH // Renamed variable
                ? finalP_trackA_orig.artists.substring(0, ARTIST_TRUNCATE_LENGTH) + '...' // Renamed variable
                : finalP_trackA_orig.artists // Renamed variable
        },
        trackB: {
            ...finalP_trackB_orig, // Renamed variable
            artists: finalP_trackB_orig.artists.length > ARTIST_TRUNCATE_LENGTH // Renamed variable
                ? finalP_trackB_orig.artists.substring(0, ARTIST_TRUNCATE_LENGTH) + '...' // Renamed variable
                : finalP_trackB_orig.artists // Renamed variable
        }
    };

    const pairs = [...firstFourPairs, finalPair]; // Renamed variable

    setComparisonPairs(pairs); // Renamed state
    setCurrentPairIndex(0); // Renamed state
    setIsComparisonActive(true); // Renamed state
    setComparisonCompleted(false); // Renamed state
    setTrackError(null);
  }, []);

  const endComparison = () => { // Renamed function
    // Reset feedback state when ending comparison
    setIsShowingFeedback(false);
    setAnswerFeedback(null);
    console.log("Comparison finished!");
    setIsComparisonActive(false); // Renamed state
    setComparisonCompleted(true); // Renamed state
    // Final score message logic removed
  };

  const handleAnswer = (chosenTrackId: string) => {
    if (isShowingFeedback) return;

    const currentPair = comparisonPairs[currentPairIndex]; // Renamed variable
    if (!currentPair) return;

    // Find original indices
    const indexA = topTracks.findIndex(t => t.id === currentPair.trackA.id); // Renamed variable
    const indexB = topTracks.findIndex(t => t.id === currentPair.trackB.id); // Renamed variable

    let correctId: string;
    if (indexA === -1 && indexB === -1) {
        console.error("Couldn't find either track in original list for feedback");
        correctId = 'error';
    } else if (indexA === -1) {
        correctId = currentPair.trackB.id; // Renamed variable
    } else if (indexB === -1) {
        correctId = currentPair.trackA.id; // Renamed variable
    } else {
        correctId = indexA < indexB ? currentPair.trackA.id : currentPair.trackB.id; // Renamed variable
    }

    // Score Update Removed

    // Set feedback state (without isCorrect)
    setAnswerFeedback({ chosenId: chosenTrackId, correctId: correctId });
    setIsShowingFeedback(true);
    // Score display state updates removed

    // Wait before proceeding
    setTimeout(() => {
      setIsShowingFeedback(false);
      setAnswerFeedback(null);

      const nextIndex = currentPairIndex + 1; // Renamed variable
      if (nextIndex < comparisonPairs.length) { // Renamed variable
        setCurrentPairIndex(nextIndex); // Renamed state
      } else {
        endComparison(); // Call endComparison after timeout if last pair
      }
    }, 1000);
  };
  // --- END COMPARISON LOGIC ---

  const fetchTopTracks = useCallback(async (token: string | null) => {
    if (!token) {
      console.error("fetchTopTracks called without a token.");
      setTrackError("Authentication token is missing.");
      setIsAuthenticated(false);
      setIsComparisonActive(false); // Renamed state
      setComparisonCompleted(false); // Renamed state
      setIsShowingFeedback(false); setAnswerFeedback(null);
      // Score resets removed
      return;
    }
    setIsLoadingTracks(true);
    setTrackError(null);
    setTopTracks([]);
    try {
      // Updated API path
      const res = await fetch('/api/spotify/spotifycompare/top-tracks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setIsAuthenticated(false);
          setUser(null);
          setSpotifyToken(null);
          setError('Your Spotify session seems invalid or expired.');
          setErrorDetails('Please log in again.');
          setTrackError(null);
          setIsComparisonActive(false); // Renamed state
          setComparisonCompleted(false); // Renamed state
          setIsShowingFeedback(false); setAnswerFeedback(null);
          // Score resets removed
        } else {
          throw new Error(data.error || `HTTP error! status: ${res.status}`);
        }
      } else {
        const fetchedTracks = data.tracks || [];
        setTopTracks(fetchedTracks);
        setError(null);
        setErrorDetails(null);
        setIsComparisonActive(false); // Renamed state
        setComparisonPairs([]); // Renamed state
        setCurrentPairIndex(0); // Renamed state
        setComparisonCompleted(false); // Renamed state
        setIsShowingFeedback(false); setAnswerFeedback(null);
        // Score resets removed

        if (fetchedTracks.length >= 10) {
          console.log("DEBUG: Tracks fetched, automatically starting comparison.");
          startComparison(fetchedTracks); // Renamed function
        } else {
          console.log("DEBUG: Not enough tracks to start comparison, marking as complete.");
          setTrackError("Not enough track data to start the comparison.");
          setComparisonCompleted(true); // Renamed state
        }
      }
    } catch (e) {
      console.error("Failed to fetch top tracks:", e);
      setTrackError(e instanceof Error ? e.message : 'An unknown error occurred while fetching tracks.');
      setError(null);
      setErrorDetails(null);
      setIsComparisonActive(false); // Renamed state
      setComparisonCompleted(false); // Renamed state
      setIsShowingFeedback(false); setAnswerFeedback(null);
      // Score resets removed
    } finally {
      setIsLoadingTracks(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startComparison]); // Removed score resets from dependencies if they were there

  // --- Auth Effect ---
  useEffect(() => {
    let isMounted = true;

    const checkAuthAndFetchData = async () => {
      if (!isMounted) return;
      setError(null);
      setErrorDetails(null);
      setTrackError(null);

      const success = searchParams.get('success');
      const urlError = searchParams.get('error');

      if (success === 'true') {
        const userNameFromUrl = searchParams.get('user');
        const tokenFromUrl = searchParams.get('access_token');

        if (!tokenFromUrl) {
            console.error('Access token missing from URL after successful auth.');
             if (isMounted) {
                setError('Authentication succeeded but token was missing.');
                setErrorDetails('Please try logging in again.');
                 if (isAuthenticated !== false) {
                     setIsAuthenticated(false);
                 }
                // Update router path
                setTimeout(() => router.replace('/spotifycompare', { scroll: false }), 0);
             }
            return;
        }

        if(isMounted) {
            if (isAuthenticated !== true) {
                 setIsAuthenticated(true);
            }
            setSpotifyToken(tokenFromUrl);
            if (userNameFromUrl) {
              setUser({ displayName: decodeURIComponent(userNameFromUrl) });
            } else {
              console.warn("Successful auth but user parameter missing.");
              setError("Auth successful, but failed to get username.");
            }

            fetchTopTracks(tokenFromUrl);
            hasProcessedAuthRef.current = true;
            // Update router path
            setTimeout(() => router.replace('/spotifycompare', { scroll: false }), 0);
        }
        return;
      }

      if (urlError) {
        const urlErrorDetails = searchParams.get('details');
        if (!isMounted) return;
        setError(urlError.replace(/\+/g, ' '));
        if (urlErrorDetails) setErrorDetails(decodeURIComponent(urlErrorDetails));
        if (isAuthenticated !== false) {
             setIsAuthenticated(false);
        }
        setSpotifyToken(null);
        setIsComparisonActive(false); // Renamed state
        hasProcessedAuthRef.current = true;
        // Update router path
        setTimeout(() => router.replace('/spotifycompare', { scroll: false }), 0);
        return;
      }

      if (!hasProcessedAuthRef.current && isAuthenticated === null) {
          setIsAuthenticated(false);
      }
    };

    checkAuthAndFetchData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router, fetchTopTracks, isAuthenticated]); // Added isAuthenticated here

  const handleLogin = () => {
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    // Updated API path
    const loginUrl = `/api/spotify/spotifycompare/login?state=${encodeURIComponent(state)}`;

    try {
      // Updated session storage key name
      sessionStorage.setItem('spotify_auth_state_compare', state);
      const storedValue = sessionStorage.getItem('spotify_auth_state_compare');
      console.log('Stored state in sessionStorage:', state);
      if (state !== storedValue) {
          console.warn('Potential issue: Value read back differs from value set!');
      }

      setTimeout(() => {
        window.location.href = loginUrl;
      }, 0);
    } catch (error) {
        console.error("Error setting sessionStorage or redirecting:", error);
        setError("Failed to initiate login.");
        setErrorDetails("Could not save authentication state.");
    }
  };

  // --- RENDER LOGIC ---\
  let content;
  if (isAuthenticated === null) {
    content = <p>Checking authentication...</p>;
  } else if (isAuthenticated === true) {
    content = (
      <div className="w-full">
        {/* Updated text */}
        {(isLoadingTracks || (isComparisonActive && !comparisonCompleted)) && <p>Preparing comparison...</p>}

        {!isLoadingTracks && trackError && (
          <div className="bg-red-800 border border-red-600 text-red-100 px-4 py-3 rounded-lg relative mb-6 max-w-lg mx-auto" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-2">{trackError}</span>
          </div>
        )}

        {/* --- Container for potential list --- */}
        {/* Updated state check */}
        {!isLoadingTracks && !trackError && comparisonCompleted && topTracks.length > 0 && (
          <div className="relative mt-6 w-full">

            {/* Track List Content */}
            <div className={`relative z-0 transition-opacity duration-300 opacity-100`}>
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-xl font-semibold font-mono text-left text-yellow-400">your top 20 most played songs in the last 6 months</h3>
                   {/* --- Start Re-added Spotify Attribution --- */}
                   <div className="flex items-center flex-shrink-0 ml-4">
                     <span className="text-xs text-gray-400 mr-2">Data provided by</span>
                     <a href="https://www.spotify.com" target="_blank" rel="noopener noreferrer" title="Spotify">
                        <Image
                           src="/icons/spotify-logo.png"
                           alt="Spotify Logo"
                           width={70}
                           height={21}
                           unoptimized
                        />
                     </a>
                   </div>
                   {/* --- End Re-added Spotify Attribution --- */}
                </div>
                {/* Apply max-width and mx-auto ONLY to the list for centering */}
                <ul className="text-left"> {/* Removed max-w-3xl */} 
                     {topTracks.map((track, index) => (
                       <li key={track.id} className={[
                        "flex items-center p-2 border-b border-gray-700 transition-colors duration-150", // Base styles
                        index === 0 ? 'bg-yellow-400/10 hover:bg-yellow-400/20' : '', // Gold
                        index === 1 ? 'bg-slate-400/10 hover:bg-slate-400/20' : '',  // Silver
                        index === 2 ? 'bg-amber-600/10 hover:bg-amber-600/20' : '',   // Bronze
                        index > 2 ? 'hover:bg-gray-800/50' : '', // Default hover for others
                      ].join(' ')}
                      >
                          <span className="text-gray-400 w-6 mr-3 text-right flex-shrink-0">{index + 1}.</span>
                          <a
                            href={track.spotifyUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center flex-grow min-w-0 ${track.spotifyUrl ? 'cursor-pointer' : 'cursor-default'}`}
                          >
                            {track.albumImageUrl && (
                                <Image
                                    src={track.albumImageUrl}
                                    alt={`Album art for ${track.name}`}
                                    width={40}
                                    height={40}
                                    className="rounded mr-3 flex-shrink-0"
                                    unoptimized
                                />
                            )}
                            <p className="text-sm truncate font-mono">
                              <span className="font-medium text-white">{track.name}</span>
                              <span className="text-gray-400"> - {track.artists}</span>
                              <span>
                                {index === 0 ? ' 🥇' : index === 1 ? ' 🥈' : index === 2 ? ' 🥉' : ''}
                              </span>
                            </p>
                          </a>
                        </li>
                     ))}
                </ul>
            </div>

            {/* Final Score Overlay Removed */}

          </div>
        )}
      </div>
    );
  } else {
    content = (
      <div className="w-full">
         {/* Updated text */}
        <p className="mb-6 text-gray-400">Compare your most played songs!</p>
        <Button onClick={handleLogin} className="font-mono bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full">
          Login with Spotify to Start
        </Button>
      </div>
    );
  }

  // Renamed variables
  const currentPair = (isComparisonActive && comparisonPairs.length > currentPairIndex)
     ? comparisonPairs[currentPairIndex]
     : null;

  // Debug Logs before render (Score related state removed)
  console.log("DEBUG Render State:", {
      isLoadingTracks,
      trackError,
      comparisonCompleted, // Renamed state
      topTracksLength: topTracks.length,
      isAuthenticated
  });

  return (
    <div>
      {error && !trackError && (
        <div className="bg-red-800 border border-red-600 text-red-100 px-4 py-3 rounded-lg relative mb-6" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
          {errorDetails && <p className="text-sm mt-1">Details: {errorDetails}</p>}
        </div>
      )}

      {content}

      {/* --- Comparison Modal --- */}
      <Dialog open={isComparisonActive}> {/* Renamed state */}
         <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-700 text-white">
           <DialogHeader className="relative">
              {/* Updated text */}
             <DialogTitle className="font-mono pr-16">
               Comparison {currentPairIndex + 1} / {comparisonPairs.length}
             </DialogTitle>
              {/* Updated text */}
             <DialogDescription>
               Which song was higher in your ranking?
             </DialogDescription>
           </DialogHeader>

           <div className="py-4 px-1">
                {currentPair ? ( // Renamed variable
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch">
                    {/* Track A Button/Card */}
                    <button
                      onClick={() => handleAnswer(currentPair.trackA.id)} // Renamed variable
                      disabled={isShowingFeedback}
                      // Updated feedback classes (only green highlight)
                      className={`relative flex-1 bg-gray-800 p-4 rounded-lg border transition-all duration-150 flex flex-col items-center text-center
                                  ${isShowingFeedback && answerFeedback?.correctId === currentPair.trackA.id ? 'border-green-500 ring-2 ring-green-500' : ''}
                                  ${!isShowingFeedback ? 'border-gray-700 hover:border-yellow-400' : 'border-gray-700'}
                                  ${isShowingFeedback ? 'opacity-75' : ''}`}
                    >
                      {currentPair.trackA.albumImageUrl ? (
                        <Image
                          src={currentPair.trackA.albumImageUrl}
                          alt={`Album art for ${currentPair.trackA.name}`}
                          width={150}
                          height={150}
                          className="rounded mb-3 shadow-md w-full object-cover aspect-square"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-[150px] bg-gray-700 rounded mb-3 flex items-center justify-center text-gray-500 text-sm">No Image</div>
                      )}
                     <div className="h-14 w-full flex flex-col justify-center items-center overflow-hidden">
                       <p className="font-semibold text-base mb-1 truncate w-full" title={currentPair.trackA.name}>{currentPair.trackA.name}</p>
                       <p className="text-sm text-gray-400 truncate w-full" title={currentPair.trackA.artists}>{currentPair.trackA.artists}</p>
                     </div>
                    </button>

                     {/* Track B Button/Card */}
                     <button
                      onClick={() => handleAnswer(currentPair.trackB.id)} // Renamed variable
                      disabled={isShowingFeedback}
                      // Updated feedback classes (only green highlight)
                       className={`relative flex-1 bg-gray-800 p-4 rounded-lg border transition-all duration-150 flex flex-col items-center text-center
                                  ${isShowingFeedback && answerFeedback?.correctId === currentPair.trackB.id ? 'border-green-500 ring-2 ring-green-500' : ''}
                                  ${!isShowingFeedback ? 'border-gray-700 hover:border-yellow-400' : 'border-gray-700'}
                                  ${isShowingFeedback ? 'opacity-75' : ''}`}
                    >
                      {currentPair.trackB.albumImageUrl ? (
                        <Image
                          src={currentPair.trackB.albumImageUrl}
                          alt={`Album art for ${currentPair.trackB.name}`}
                          width={150}
                          height={150}
                          className="rounded mb-3 shadow-md w-full object-cover aspect-square"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-[150px] bg-gray-700 rounded mb-3 flex items-center justify-center text-gray-500 text-sm">No Image</div>
                      )}
                     <div className="h-14 w-full flex flex-col justify-center items-center overflow-hidden">
                       <p className="font-semibold text-base mb-1 truncate w-full" title={currentPair.trackB.name}>{currentPair.trackB.name}</p>
                       <p className="text-sm text-gray-400 truncate w-full" title={currentPair.trackB.artists}>{currentPair.trackB.artists}</p>
                     </div>
                    </button>
                  </div>
                ) : (
                     <p>Loading comparison...</p> // Updated text
                )}

                 <div className="mt-6 text-center">
                    <button
                        onClick={() => endComparison()} // Renamed function
                        disabled={isShowingFeedback}
                        className={`text-sm text-gray-400 hover:text-yellow-400 font-mono lowercase transition-colors duration-150 ${isShowingFeedback ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                         {/* Updated text */}
                        skip comparison, show me my top songs
                    </button>
                 </div>
           </div>
         </DialogContent>
       </Dialog>
    </div>
  );
}