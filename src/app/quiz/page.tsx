'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image'; // Import Image component
import Link from 'next/link'; // Import Link
import { Button } from '@/components/ui/button';
// import { getCookie } from 'cookies-next'; // No longer checking cookies here

// Type for user data
interface UserProfile {
  displayName?: string;
  id?: string;
  email?: string;
}

// Type for track data
interface Track {
  id: string;
  name: string;
  artists: string;
  albumImageUrl?: string;
}

export default function QuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  // const [isLoadingUser, setIsLoadingUser] = useState(false); // Removed user loading state
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // State for tracks
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);

  // State to hold the access token obtained from URL
  const [/* spotifyToken */, setSpotifyToken] = useState<string | null>(null); // Linter doesn't like unused state var, prefix with /* */

  // Pass spotifyToken from state to fetchTopTracks if needed, 
  // although currently it receives the token directly as an argument.
  // If we wanted to trigger fetchTopTracks based on spotifyToken changing, we'd adjust dependencies.
  const fetchTopTracks = useCallback(async (token: string | null) => {
    // Check if token is available before fetching
    if (!token) {
      console.error("fetchTopTracks called without a token.");
      setTrackError("Authentication token is missing.");
      setIsAuthenticated(false); // Ensure auth state reflects missing token
      return;
    }

    setIsLoadingTracks(true);
    setTrackError(null);
    setTopTracks([]);

    try {
      // Pass token in Authorization header
      const res = await fetch('/api/spotify/quiz/top-tracks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setIsAuthenticated(false);
          setUser(null);
          setSpotifyToken(null); // Clear invalid token
          setError('Your Spotify session seems invalid or expired.');
          setErrorDetails('Please log in again.');
          setTrackError(null);
        } else {
          throw new Error(data.error || `HTTP error! status: ${res.status}`);
        }
      } else {
        setTopTracks(data.tracks || []);
        setError(null); 
        setErrorDetails(null);
      }
    } catch (e) {
      console.error("Failed to fetch top tracks:", e);
      setTrackError(e instanceof Error ? e.message : 'An unknown error occurred while fetching tracks.');
      setError(null);
      setErrorDetails(null);
    } finally {
      setIsLoadingTracks(false);
    }
  }, []); // Empty dependency array, relies on token passed as argument

  useEffect(() => {
    let isMounted = true;
    // Log search params on every effect run
    const currentSearchParams = new URLSearchParams(searchParams.toString()); 
    console.log('[Effect Run] Current searchParams:', currentSearchParams.toString());
    // Log full sessionStorage content
    try {
      console.log('[Effect Run] Full sessionStorage content:', JSON.stringify(sessionStorage));
    } catch (e) {
      console.error('Error stringifying sessionStorage:', e);
    }
    console.log('[Effect Run] Direct read of spotify_auth_state_quiz:', sessionStorage.getItem('spotify_auth_state_quiz'));

    const checkAuthAndFetchData = async () => {
      // Clear previous errors on re-check
      if (isMounted) {
          setError(null);
          setErrorDetails(null);
          setTrackError(null);
      }

      const success = searchParams.get('success');
      
      // Log values specifically before the check
      const stateFromUrlLog = searchParams.get('state'); 
      const originalStateLog = sessionStorage.getItem('spotify_auth_state_quiz');
      console.log('[Effect Check] Values before branching:', { success, stateFromUrl: stateFromUrlLog, originalState: originalStateLog });

      if (success === 'true') {
        if (!isMounted) return;

        const stateFromUrl = searchParams.get('state');
        const originalState = sessionStorage.getItem('spotify_auth_state_quiz');
        const userNameFromUrl = searchParams.get('user');
        const tokenFromUrl = searchParams.get('access_token'); // Get token from URL

        // *** Detailed Logging before State Validation ***
        console.log('--- Inside success=true block ---');
        console.log('State from URL (value): ', stateFromUrl);
        console.log('State from URL (type): ', typeof stateFromUrl);
        console.log('State from Storage (value): ', originalState);
        console.log('State from Storage (type): ', typeof originalState);
        console.log('Comparison (stateFromUrl !== originalState): ', stateFromUrl !== originalState);
        console.log('Check 1 (!stateFromUrl): ', !stateFromUrl);
        console.log('Check 2 (!originalState): ', !originalState);
        console.log('Check 3 (comparison): ', stateFromUrl !== originalState);
        console.log('--------------------------------');

        // *** State Validation FIRST ***
        if (!stateFromUrl || !originalState || stateFromUrl !== originalState) {
           console.error('State mismatch detected on client-side.', { stateFromUrl, originalState });
           if (isMounted) {
             setError('Authentication failed (State mismatch).');
             setErrorDetails('Please try logging in again.');
             setIsAuthenticated(false); 
             sessionStorage.removeItem('spotify_auth_state_quiz'); // Clean up storage on error
             router.replace('/quiz', { scroll: false }); // Clean up URL on error
           }
           return; // Stop processing
        }

        // State is VALID
        console.log('Client-side state validation successful.');
        sessionStorage.removeItem('spotify_auth_state_quiz');

        // *** Token Check ***
        if (!tokenFromUrl) {
            console.error('Access token missing from URL after successful auth.');
             if (isMounted) {
                setError('Authentication succeeded but token was missing.');
                setErrorDetails('Please try logging in again.');
                setIsAuthenticated(false); 
                router.replace('/quiz', { scroll: false });
            }
            return; // Stop processing
        }

        // If we reach here, state is valid AND token is present
        console.log('Access token received from URL.');
        if(isMounted) {
            // Set Authenticated State
            setIsAuthenticated(true);
            setSpotifyToken(tokenFromUrl); // Store token in state

            if (userNameFromUrl) {
              setUser({ displayName: decodeURIComponent(userNameFromUrl) });
            } else {
              console.warn("Successful auth but user parameter missing.");
              setError("Auth successful, but failed to get username.");
            }
            
            // Fetch tracks using the token we just received
            await fetchTopTracks(tokenFromUrl);

            // Clean up URL AFTER setting state and initiating fetch
            router.replace('/quiz', { scroll: false });
        }
        return; // Don't proceed to other checks
      }

      const urlError = searchParams.get('error');
      const urlErrorDetails = searchParams.get('details');
      if (urlError) {
        if (!isMounted) return;
        sessionStorage.removeItem('spotify_auth_state_quiz'); 
        setError(urlError.replace(/\+/g, ' '));
        if (urlErrorDetails) setErrorDetails(decodeURIComponent(urlErrorDetails));
        setIsAuthenticated(false); 
        setSpotifyToken(null); // Clear any potentially stale token
        router.replace('/quiz', { scroll: false });
        return; 
      } 
      
      // No need to check cookies anymore, if isAuthenticated is null and no URL params, 
      // it means user needs to log in.
      if (isAuthenticated === null) {
          setIsAuthenticated(false); // Set to false if initial state and no params handled it
      }
    };

    checkAuthAndFetchData();

    return () => {
      isMounted = false;
    };
  // Removed fetchTopTracks from dependencies as it's called with token directly
  }, [searchParams, router]); 

  const handleLogin = () => {
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const loginUrl = `/api/spotify/quiz/login?state=${encodeURIComponent(state)}`;

    try {
      sessionStorage.setItem('spotify_auth_state_quiz', state);
      // Log the value *immediately after* setting it
      const storedValue = sessionStorage.getItem('spotify_auth_state_quiz');
      console.log('Stored state in sessionStorage:', state);
      console.log('Value read back immediately after setItem:', storedValue);
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

  // Render based on authentication state
  let content;
  if (isAuthenticated === null) {
    content = <p>Checking authentication...</p>; // Keep centered or adjust as needed
  } else if (isAuthenticated && user) {
    content = (
      <div className="w-full">
        <p className="mb-6 text-lg">
          {/* Authenticated as {user.displayName || user.id || 'User'}! */}
        </p>

        {isLoadingTracks && <p>Fetching your top tracks...</p>}

        {!isLoadingTracks && trackError && (
          <div className="bg-red-800 border border-red-600 text-red-100 px-4 py-3 rounded-lg relative mb-6 max-w-lg mx-auto" role="alert">
            <strong className="font-bold">Track Error:</strong>
            <span className="block sm:inline ml-2">{trackError}</span>
          </div>
        )}

        {!isLoadingTracks && !trackError && topTracks.length > 0 && (
          <div className="mt-6 w-full max-w-lg mx-auto">
            <h3 className="text-xl font-semibold mb-4 font-mono text-left">Your Top 20 Tracks (Medium Term)</h3>
            <ul className="space-y-3 text-left">
              {topTracks.map((track, index) => (
                <li key={track.id} className="flex items-center bg-gray-800 p-3 rounded-md shadow">
                  <span className="text-gray-400 w-6 mr-3 text-right">{index + 1}.</span>
                  {track.albumImageUrl && (
                    <Image
                      src={track.albumImageUrl}
                      alt={`Album art for ${track.name}`}
                      width={40}
                      height={40}
                      className="rounded mr-3"
                      unoptimized
                    />
                  )}
                  <div>
                    <p className="font-medium text-white">{track.name}</p>
                    <p className="text-sm text-gray-400">{track.artists}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {!isLoadingTracks && !trackError && topTracks.length === 0 && (
            <p className="text-gray-400">Ready.</p>
        )}
      </div>
    );
  } else {
    content = (
      <div className="w-full">
        <p className="mb-6 text-gray-400">Find out which of your own songs you listened to more!</p>
        <Button onClick={handleLogin} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full">
          Login with Spotify to Start
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      <div className="w-full max-w-7xl mx-auto px-4 pt-8">
        <div className="sticky top-0 z-20 bg-black py-3 -mt-8 -mx-4 px-4 mb-4">
          <Link href="/" className="text-1xl font-mono block hover:text-yellow-400 transition-colors duration-200">
            &larr; back to home
          </Link>
        </div>
        <h2 className="text-3xl font-semibold mb-6 font-mono">Spotify Top Tracks Quiz</h2>

        {error && !trackError && (
          <div className="bg-red-800 border border-red-600 text-red-100 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-2">{error}</span>
            {errorDetails && <p className="text-sm mt-1">Details: {errorDetails}</p>}
          </div>
        )}
        {content}
      </div>
    </div>
  );
} 