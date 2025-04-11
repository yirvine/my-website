'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
// import Link from 'next/link'; // Removed unused import
import { Button } from '@/components/ui/button';
// Import Shadcn Dialog components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  // DialogTrigger, // We'll open programmatically
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
}

// Helper function to shuffle an array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

// Define structure for a quiz question pair
interface QuizQuestion {
  trackA: Track;
  trackB: Track;
}

// Component containing all the client-side logic
export default function QuizClient() {
  const router = useRouter();
  // useSearchParams MUST be used within a Client Component
  const searchParams = useSearchParams(); 
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [/* spotifyToken */, setSpotifyToken] = useState<string | null>(null);

  // --- NEW Quiz State ---
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // --- End Quiz State ---

  // Ref to track if initial auth redirect has been processed
  const hasProcessedAuthRef = useRef(false);

  const fetchTopTracks = useCallback(async (token: string | null) => {
    if (!token) {
      console.error("fetchTopTracks called without a token.");
      setTrackError("Authentication token is missing.");
      console.log('DEBUG: fetchTopTracks setting isAuthenticated = false (no token)');
      setIsAuthenticated(false);
      setIsQuizActive(false);
      return;
    }
    setIsLoadingTracks(true);
    setTrackError(null);
    setTopTracks([]);
    try {
      const res = await fetch('/api/spotify/quiz/top-tracks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          console.log('DEBUG: fetchTopTracks setting isAuthenticated = false (401 error)');
          setIsAuthenticated(false);
          setUser(null);
          setSpotifyToken(null);
          setError('Your Spotify session seems invalid or expired.');
          setErrorDetails('Please log in again.');
          setTrackError(null);
          setIsQuizActive(false);
        } else {
          throw new Error(data.error || `HTTP error! status: ${res.status}`);
        }
      } else {
        setTopTracks(data.tracks || []);
        setError(null);
        setErrorDetails(null);
        setIsQuizActive(false);
        setQuizQuestions([]);
        setCurrentQuestionIndex(0);
      }
    } catch (e) {
      console.error("Failed to fetch top tracks:", e);
      setTrackError(e instanceof Error ? e.message : 'An unknown error occurred while fetching tracks.');
      setError(null);
      setErrorDetails(null);
      setIsQuizActive(false);
    } finally {
      setIsLoadingTracks(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const currentSearchParams = new URLSearchParams(searchParams.toString());
    console.log('[Effect Run] Current searchParams:', currentSearchParams.toString());

    const checkAuthAndFetchData = async () => {
      if (!isMounted) return;
      setError(null);
      setErrorDetails(null);
      setTrackError(null);

      const success = searchParams.get('success');
      const urlError = searchParams.get('error');
      console.log('[Effect Check] Values before branching:', { success, urlError });

      // --- Handle SUCCESS Param --- 
      if (success === 'true') {
        const userNameFromUrl = searchParams.get('user');
        const tokenFromUrl = searchParams.get('access_token');

        // *** Token Check ***
        if (!tokenFromUrl) {
            console.error('Access token missing from URL after successful auth.');
             if (isMounted) {
                setError('Authentication succeeded but token was missing.');
                setErrorDetails('Please try logging in again.');
                 if (isAuthenticated !== false) {
                     console.log("DEBUG: Setting Authenticated State to FALSE due to missing token.");
                     setIsAuthenticated(false);
                 }
                router.replace('/quiz', { scroll: false }); // Clear URL even on error
             }
            return;
        }

        console.log('Access token received from URL.');
        console.log('DEBUG: Setting Authenticated State...');
        if(isMounted) {
            if (isAuthenticated !== true) {
                 setIsAuthenticated(true);
                 console.log('DEBUG: setIsAuthenticated(true) called.');
            }
            setSpotifyToken(tokenFromUrl);
            if (userNameFromUrl) {
              setUser({ displayName: decodeURIComponent(userNameFromUrl) });
              console.log('DEBUG: setUser called.');
            } else {
              console.warn("Successful auth but user parameter missing.");
              setError("Auth successful, but failed to get username.");
            }
            
            fetchTopTracks(tokenFromUrl);
            // Mark auth as processed
            hasProcessedAuthRef.current = true; 
            console.log("DEBUG: Set hasProcessedAuthRef to true (success).");
            setTimeout(() => router.replace('/quiz', { scroll: false }), 0);
        }
        console.log("DEBUG: Processed success=true block.");
        return; // Exit after handling success
      }

      // --- Handle ERROR Param --- 
      if (urlError) {
        const urlErrorDetails = searchParams.get('details');
        if (!isMounted) return;
        setError(urlError.replace(/\+/g, ' '));
        if (urlErrorDetails) setErrorDetails(decodeURIComponent(urlErrorDetails));
        if (isAuthenticated !== false) {
             console.log('DEBUG: Setting Authenticated State to FALSE due to urlError.');
             setIsAuthenticated(false);
        }
        setSpotifyToken(null);
        setIsQuizActive(false);
        // Mark auth as processed (even on error)
        hasProcessedAuthRef.current = true;
        console.log("DEBUG: Set hasProcessedAuthRef to true (error).");
        setTimeout(() => router.replace('/quiz', { scroll: false }), 0);
        console.log("DEBUG: Processed urlError block.");
        return; // Exit after handling error
      }

      // --- Handle Initial Load (ONLY if auth hasn't been processed yet) --- 
      if (!hasProcessedAuthRef.current && isAuthenticated === null) {
          console.log('DEBUG: Setting Authenticated State to FALSE due to initial load (auth not processed).');
          setIsAuthenticated(false);
      } else {
           console.log(`DEBUG: Initial load check skipped, hasProcessedAuth: ${hasProcessedAuthRef.current}, isAuthenticated: ${isAuthenticated}`);
      }
    };

    // Only run check if auth hasn't been processed by this ref yet
    // to prevent potential issues if params change for other reasons later.
    // Although, the returns should prevent this.
    // Let's stick to the logic inside checkAuthAndFetchData for now.
    checkAuthAndFetchData();

    return () => {
      isMounted = false;
    };
  }, [searchParams, router]); 

  const handleLogin = () => {
    // Restore state generation
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    // Add state to login URL query parameters
    const loginUrl = `/api/spotify/quiz/login?state=${encodeURIComponent(state)}`; 
    
    try {
      // Restore sessionStorage logic
      sessionStorage.setItem('spotify_auth_state_quiz', state);
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

  // --- NEW Quiz Logic ---
  const startQuiz = () => {
    if (topTracks.length < 10) {
      // Need at least 10 tracks for 5 pairs
      setTrackError("Not enough track data to start the quiz."); // Or a general error
      return;
    }
    // Shuffle tracks and pick first 10 for 5 pairs
    const shuffledTracks = shuffleArray([...topTracks]);
    const selectedTracks = shuffledTracks.slice(0, 10);
    
    const questions: QuizQuestion[] = [];
    for (let i = 0; i < 10; i += 2) {
      questions.push({ trackA: selectedTracks[i], trackB: selectedTracks[i+1] });
    }

    setQuizQuestions(questions);
    setCurrentQuestionIndex(0);
    setIsQuizActive(true);
    setTrackError(null); // Clear any previous errors
  };

  const handleAnswer = (chosenTrackId: string) => {
    // TODO: Implement scoring or answer tracking later
    console.log(`User chose track ID: ${chosenTrackId} for question ${currentQuestionIndex}`);

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < quizQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
    } else {
      // Quiz finished
      endQuiz();
    }
  };

  const endQuiz = () => {
    console.log("Quiz finished!");
    setIsQuizActive(false);
    // TODO: Show results?
  };
  // --- End Quiz Logic ---

  // --- RENDER LOGIC --- (Moved from page.tsx)
  let content;
  if (isAuthenticated === null) {
    // Still loading initial auth status
    content = <p>Checking authentication...</p>;
  } else if (isAuthenticated === true) {
    // AUTHENTICATED! Now show user info or loading tracks
    content = (
      <div className="w-full">
        {/* Show username when available, otherwise generic auth message */}
        <p className="mb-6 text-lg">
          Authenticated as {user ? (user.displayName || user.id || 'User') : '...'}!
        </p>
        {/* Rest of the track loading/display logic */}
        {isLoadingTracks && <p>Fetching your top tracks...</p>}
        
        {!isLoadingTracks && trackError && (
          <div className="bg-red-800 border border-red-600 text-red-100 px-4 py-3 rounded-lg relative mb-6 max-w-lg mx-auto" role="alert">
            <strong className="font-bold">Track Error:</strong>
            <span className="block sm:inline ml-2">{trackError}</span>
          </div>
        )}
        
        {!isLoadingTracks && !trackError && topTracks.length > 0 && (
          <div className="mt-6 w-full max-w-lg mx-auto">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-semibold font-mono text-left">Your Top 20 Tracks</h3>
                 {!isQuizActive && topTracks.length >= 10 && (
                    <Button onClick={startQuiz} size="sm" className="font-mono lowercase">Start Quiz</Button>
                 )}
            </div>
            {topTracks.length < 10 && <p className="text-sm text-yellow-500">Need at least 10 tracks to start the quiz.</p>} 
            <div className={`${isQuizActive ? 'filter blur-sm pointer-events-none' : ''}`}>
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
          </div>
        )}
        
        {!isLoadingTracks && !trackError && topTracks.length === 0 && (
            <p className="text-gray-400">Ready.</p>
        )}
      </div>
    );
  } else {
    // Only show login if isAuthenticated is explicitly false
    content = (
      <div className="w-full">
        <p className="mb-6 text-gray-400">Find out which of your own songs you listened to more!</p>
        <Button onClick={handleLogin} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full">
          Login with Spotify to Start
        </Button>
      </div>
    );
  }

  // Get current question data safely
  const currentQuestion = (isQuizActive && quizQuestions.length > currentQuestionIndex)
     ? quizQuestions[currentQuestionIndex]
     : null;

  return (
    <div> {/* Wrapper div */} 
      {/* Display general errors if any */} 
      {error && !trackError && (
        <div className="bg-red-800 border border-red-600 text-red-100 px-4 py-3 rounded-lg relative mb-6" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
          {errorDetails && <p className="text-sm mt-1">Details: {errorDetails}</p>}
        </div>
      )}
      
      {/* Render main page content */} 
      {content}

      {/* --- Quiz Modal --- */} 
      <Dialog open={isQuizActive} onOpenChange={(open: boolean) => !open && endQuiz()}> 
         <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-700 text-white">
           <DialogHeader>
             <DialogTitle className="font-mono">Question {currentQuestionIndex + 1} / {quizQuestions.length}</DialogTitle>
             <DialogDescription>
               Which song do you think you listened to more?
             </DialogDescription>
           </DialogHeader>
           
           {/* --- Modal Body --- */} 
           <div className="py-4 px-1"> {/* Add padding */} 
                {currentQuestion ? (
                  // Flex container for the two choices
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch"> {/* Use items-stretch */} 
                    {/* Track A Button/Card */} 
                    <button
                      onClick={() => handleAnswer(currentQuestion.trackA.id)}
                      className="flex-1 bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-75 transition-all duration-150 flex flex-col items-center text-center"
                    >
                      {currentQuestion.trackA.albumImageUrl ? (
                        <Image
                          src={currentQuestion.trackA.albumImageUrl}
                          alt={`Album art for ${currentQuestion.trackA.name}`}
                          width={150} // Increased size for modal
                          height={150}
                          className="rounded mb-3 shadow-md w-full object-cover aspect-square" // Ensure aspect ratio
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-[150px] bg-gray-700 rounded mb-3 flex items-center justify-center text-gray-500 text-sm">No Image</div>
                      )}
                      <p className="font-semibold text-base mb-1 truncate w-full" title={currentQuestion.trackA.name}>{currentQuestion.trackA.name}</p>
                      <p className="text-sm text-gray-400 truncate w-full" title={currentQuestion.trackA.artists}>{currentQuestion.trackA.artists}</p>
                    </button>

                    {/* Separator (optional) */} 
                    {/* <div className="hidden sm:block border-l border-gray-600 mx-2"></div> */}

                     {/* Track B Button/Card */} 
                     <button
                      onClick={() => handleAnswer(currentQuestion.trackB.id)}
                      className="flex-1 bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-75 transition-all duration-150 flex flex-col items-center text-center"
                    >
                      {currentQuestion.trackB.albumImageUrl ? (
                        <Image
                          src={currentQuestion.trackB.albumImageUrl}
                          alt={`Album art for ${currentQuestion.trackB.name}`}
                          width={150}
                          height={150}
                          className="rounded mb-3 shadow-md w-full object-cover aspect-square"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-[150px] bg-gray-700 rounded mb-3 flex items-center justify-center text-gray-500 text-sm">No Image</div>
                      )}
                      <p className="font-semibold text-base mb-1 truncate w-full" title={currentQuestion.trackB.name}>{currentQuestion.trackB.name}</p>
                      <p className="text-sm text-gray-400 truncate w-full" title={currentQuestion.trackB.artists}>{currentQuestion.trackB.artists}</p>
                    </button>
                  </div>
                ) : (
                     <p>Loading question...</p>
                )}
           </div>
         </DialogContent>
       </Dialog>
    </div>
  );
} 