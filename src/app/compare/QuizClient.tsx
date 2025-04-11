"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
// import Link from 'next/link'; // Removed unused import
import { Button } from "@/components/ui/button"
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
  displayName?: string
  id?: string
  email?: string
}
interface Track {
  id: string
  name: string
  artists: string
  albumImageUrl?: string
  spotifyUrl?: string
}

// Helper function to shuffle an array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length,
    randomIndex
  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--
    // And swap it with the current element.
    ;[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]
  }
  return array
}

// Define structure for a comparison pair
interface ComparisonPair {
  trackA: Track
  trackB: Track
}

// Component containing all the client-side logic
export default function CompareClient() {
  const router = useRouter()
  // useSearchParams MUST be used within a Client Component
  const searchParams = useSearchParams()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [/* user */ , setUser] = useState<UserProfile | null>(null) // Comment out user state variable
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [topTracks, setTopTracks] = useState<Track[]>([])
  const [isLoadingTracks, setIsLoadingTracks] = useState(false)
  const [trackError, setTrackError] = useState<string | null>(null)
  const [/* spotifyToken */ , setSpotifyToken] = useState<string | null>(null)

  // --- Comparison State ---
  const [isComparing, setIsComparing] = useState(false) // Renamed from isQuizActive
  const [comparisonPairs, setComparisonPairs] = useState<ComparisonPair[]>([]) // Renamed from quizQuestions
  const [currentPairIndex, setCurrentPairIndex] = useState(0) // Renamed from currentQuestionIndex
  const [comparisonCompleted, setComparisonCompleted] = useState(false) // Renamed from quizCompleted
  
  // --- Feedback State ---
  const [answerFeedback, setAnswerFeedback] = useState<{
    chosenId: string
    correctId: string
    isCorrect: boolean
  } | null>(null)
  const [isShowingFeedback, setIsShowingFeedback] = useState(false)

  // Ref to track if initial auth redirect has been processed
  const hasProcessedAuthRef = useRef(false)

  // --- DEFINE COMPARISON LOGIC FIRST ---
  const startComparison = useCallback((tracks: Track[]) => {
    console.log("DEBUG: startComparison function called.")
    // REMOVED score reset
    // setShowScore(false);
    // setDisplayedDenominator(0);
    // setShowFinalScoreMessage(false);

    // Ensure enough tracks
    if (tracks.length < 10) {
      console.error("Not enough tracks for comparison structure (need 10).")
      setTrackError("Not enough track data to start comparison.")
      setIsComparing(false)
      setComparisonCompleted(true)
      return
    }

    const track1 = tracks[0]
    const track2 = tracks[1]
    const remainingTracks = tracks.slice(2)
    const shuffledRemaining = shuffleArray([...remainingTracks])

    const ARTIST_TRUNCATE_LENGTH = 30

    const selectedRemaining = shuffledRemaining.slice(0, 8)

    const firstFourPairs: ComparisonPair[] = []
    for (let i = 0; i < 8; i += 2) {
      const trackA_orig = selectedRemaining[i]
      const trackB_orig = selectedRemaining[i + 1]
      firstFourPairs.push({
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
      })
    }

    const finalPairTracks = Math.random() < 0.5 ? [track1, track2] : [track2, track1]
    const finalP_trackA_orig = finalPairTracks[0]
    const finalP_trackB_orig = finalPairTracks[1]

    const finalPair: ComparisonPair = {
      trackA: {
        ...finalP_trackA_orig,
        artists: finalP_trackA_orig.artists.length > ARTIST_TRUNCATE_LENGTH
          ? finalP_trackA_orig.artists.substring(0, ARTIST_TRUNCATE_LENGTH) + '...'
          : finalP_trackA_orig.artists
      },
      trackB: {
        ...finalP_trackB_orig,
        artists: finalP_trackB_orig.artists.length > ARTIST_TRUNCATE_LENGTH
          ? finalP_trackB_orig.artists.substring(0, ARTIST_TRUNCATE_LENGTH) + '...'
          : finalP_trackB_orig.artists
      }
    }

    const pairs = [...firstFourPairs, finalPair]

    setComparisonPairs(pairs)
    setCurrentPairIndex(0)
    setIsComparing(true)
    setComparisonCompleted(false)
    setTrackError(null)
  }, []) // Empty dependency array

  const endComparison = (skipped = false) => {
    // Reset feedback state when ending
    setIsShowingFeedback(false)
    setAnswerFeedback(null)
    console.log("DEBUG: endComparison called. Skipped:", skipped)
    setIsComparing(false)
    setComparisonCompleted(true)
    // REMOVED final score message logic
  }

  const handleAnswer = (chosenTrackId: string) => {
    if (isShowingFeedback) return // Prevent double clicks during feedback

    const currentP = comparisonPairs[currentPairIndex]
    if (!currentP) return // Should not happen

    // Find original indices
    const indexA = topTracks.findIndex((t) => t.id === currentP.trackA.id)
    const indexB = topTracks.findIndex((t) => t.id === currentP.trackB.id)

    // Determine correct answer (lower index is higher rank)
    let correctId: string
    if (indexA === -1 && indexB === -1) {
      console.error("Couldn't find either track in original list for feedback")
      correctId = "error" // Handle error case
    } else if (indexA === -1) {
      correctId = currentP.trackB.id // B must be correct if A not found
    } else if (indexB === -1) {
      correctId = currentP.trackA.id // A must be correct if B not found
    } else {
      correctId = indexA < indexB ? currentP.trackA.id : currentP.trackB.id
    }

    const isCorrect = chosenTrackId === correctId

    // REMOVED score update
    // if (isCorrect) {
    //     setScore(prevScore => prevScore + 1);
    // }

    // Set feedback state
    setAnswerFeedback({ chosenId: chosenTrackId, correctId: correctId, isCorrect })
    setIsShowingFeedback(true)
    // REMOVED score display updates
    // setShowScore(true);
    // setDisplayedDenominator(currentPairIndex + 1);

    // Wait before proceeding
    setTimeout(() => {
      setIsShowingFeedback(false)
      setAnswerFeedback(null)
      
      const nextIndex = currentPairIndex + 1
      if (nextIndex < comparisonPairs.length) {
        setCurrentPairIndex(nextIndex)
      } else {
        endComparison() // Call endComparison (without skipped=true)
      }
    }, 1000) // 1 second delay
  }
  // --- END COMPARISON LOGIC ---

  // --- FETCH TRACKS (depends on startComparison having stable identity) ---
  const fetchTopTracks = useCallback(
    async (token: string | null) => {
      if (!token) {
        console.error("fetchTopTracks called without a token.")
        setTrackError("Authentication token is missing.")
        setIsAuthenticated(false)
        setIsComparing(false)
        setComparisonCompleted(false)
        setIsShowingFeedback(false)
        setAnswerFeedback(null)
        // REMOVED score resets
        return
      }
      setIsLoadingTracks(true)
      setTrackError(null)
      setTopTracks([])
      try {
        // ASSUMPTION: API route renamed to /compare/
        const res = await fetch("/api/spotify/compare/top-tracks", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await res.json()
        if (!res.ok) {
          if (res.status === 401) {
            console.log("DEBUG: fetchTopTracks setting isAuthenticated = false (401 error)")
            setIsAuthenticated(false)
            setUser(null)
            setSpotifyToken(null)
            setError("Your Spotify session seems invalid or expired.")
            setErrorDetails("Please log in again.")
            setTrackError(null)
            setIsComparing(false)
            setComparisonCompleted(false)
            setIsShowingFeedback(false)
            setAnswerFeedback(null) // Reset on error
            // REMOVED score resets
          } else {
            throw new Error(data.error || `HTTP error! status: ${res.status}`)
          }
        } else {
          const fetchedTracks = data.tracks || []
          setTopTracks(fetchedTracks)
          setError(null)
          setErrorDetails(null)
          setIsComparing(false)
          setComparisonPairs([])
          setCurrentPairIndex(0)
          setComparisonCompleted(false)
          setIsShowingFeedback(false)
          setAnswerFeedback(null) // Reset on success before start
          // REMOVED score resets
          
          if (fetchedTracks.length >= 10) {
            console.log("DEBUG: Tracks fetched, automatically starting comparison.")
            startComparison(fetchedTracks) // Use renamed function
          } else {
            console.log("DEBUG: Not enough tracks to start comparison, marking as complete.")
            setTrackError("Not enough track data to start comparison.")
            setComparisonCompleted(true)
            // Set score to 0 even if comparison doesn't start
            // setScore(0); // Already set above
          }
        }
      } catch (e) {
        console.error("Failed to fetch top tracks:", e)
        setTrackError(e instanceof Error ? e.message : "An unknown error occurred while fetching tracks.")
        setError(null)
        setErrorDetails(null)
        setIsComparing(false)
        setComparisonCompleted(false)
        setIsShowingFeedback(false)
        setAnswerFeedback(null) // Reset on error
        // REMOVED score resets
      } finally {
        setIsLoadingTracks(false)
      }
    },
    [startComparison],
  ) // Dependency: startComparison (now stable due to useCallback)

  // --- Auth Effect (depends on fetchTopTracks having stable identity) ---
  useEffect(() => {
    let isMounted = true
    const targetPath = '/spotify-compare' // Update if you chose a different path
    const currentSearchParams = new URLSearchParams(searchParams.toString())
    console.log("[Effect Run] Current searchParams:", currentSearchParams.toString())

    const checkAuthAndFetchData = async () => {
      if (!isMounted) return
      setError(null)
      setErrorDetails(null)
      setTrackError(null)

      const success = searchParams.get("success")
      const urlError = searchParams.get("error")
      console.log("[Effect Check] Values before branching:", { success, urlError })

      // --- Handle SUCCESS Param ---
      if (success === "true") {
        const userNameFromUrl = searchParams.get("user")
        const tokenFromUrl = searchParams.get("access_token")

        // *** Token Check ***
        if (!tokenFromUrl) {
          console.error("Access token missing from URL after successful auth.")
          if (isMounted) {
            setError("Authentication succeeded but token was missing.")
            setErrorDetails("Please try logging in again.")
            if (isAuthenticated !== false) {
              console.log("DEBUG: Setting Authenticated State to FALSE due to missing token.")
              setIsAuthenticated(false)
            }
            router.replace("/quiz", { scroll: false }) // Clear URL even on error
          }
          return
        }

        console.log("Access token received from URL.")
        console.log("DEBUG: Setting Authenticated State...")
        if (isMounted) {
          if (isAuthenticated !== true) {
            setIsAuthenticated(true)
            console.log("DEBUG: setIsAuthenticated(true) called.")
          }
          setSpotifyToken(tokenFromUrl)
          if (userNameFromUrl) {
            setUser({ displayName: decodeURIComponent(userNameFromUrl) })
            console.log("DEBUG: setUser called.")
          } else {
            console.warn("Successful auth but user parameter missing.")
            setError("Auth successful, but failed to get username.")
          }

          fetchTopTracks(tokenFromUrl)
          // Mark auth as processed
          hasProcessedAuthRef.current = true
          console.log("DEBUG: Set hasProcessedAuthRef to true (success).")
          setTimeout(() => router.replace(targetPath, { scroll: false }), 0)
        }
        console.log("DEBUG: Processed success=true block.")
        return // Exit after handling success
      }

      // --- Handle ERROR Param ---
      if (urlError) {
        const urlErrorDetails = searchParams.get("details")
        if (!isMounted) return
        setError(urlError.replace(/\+/g, " "))
        if (urlErrorDetails) setErrorDetails(decodeURIComponent(urlErrorDetails))
        if (isAuthenticated !== false) {
          console.log("DEBUG: Setting Authenticated State to FALSE due to urlError.")
          setIsAuthenticated(false)
        }
        setSpotifyToken(null)
        setIsComparing(false)
        // Mark auth as processed (even on error)
        hasProcessedAuthRef.current = true
        console.log("DEBUG: Set hasProcessedAuthRef to true (error).")
        setTimeout(() => router.replace(targetPath, { scroll: false }), 0)
        console.log("DEBUG: Processed urlError block.")
        return // Exit after handling error
      }

      // --- Handle Initial Load (ONLY if auth hasn't been processed yet) ---
      if (!hasProcessedAuthRef.current && isAuthenticated === null) {
        console.log("DEBUG: Setting Authenticated State to FALSE due to initial load (auth not processed).")
        setIsAuthenticated(false)
      } else {
        console.log(
          `DEBUG: Initial load check skipped, hasProcessedAuth: ${hasProcessedAuthRef.current}, isAuthenticated: ${isAuthenticated}`,
        )
      }
    }

    // Only run check if auth hasn't been processed by this ref yet
    // to prevent potential issues if params change for other reasons later.
    // Although, the returns should prevent this.
    // Let's stick to the logic inside checkAuthAndFetchData for now.
    checkAuthAndFetchData()

    return () => {
      isMounted = false
    }
  }, [searchParams, router, fetchTopTracks]) // Dependency: fetchTopTracks (stable)

  const handleLogin = () => {
    // Restore state generation
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    // ASSUMPTION: API route renamed to /compare/
    const loginUrl = `/api/spotify/compare/login?state=${encodeURIComponent(state)}`
    
    try {
      // Restore sessionStorage logic
      sessionStorage.setItem("spotify_auth_state_compare", state)
      const storedValue = sessionStorage.getItem("spotify_auth_state_compare")
      console.log("Stored state in sessionStorage:", state)
      console.log("Value read back immediately after setItem:", storedValue)
      if (state !== storedValue) {
        console.warn("Potential issue: Value read back differs from value set!")
      }

      setTimeout(() => {
        window.location.href = loginUrl
      }, 0)
    } catch (error) {
      console.error("Error setting sessionStorage or redirecting:", error)
      setError("Failed to initiate login.")
      setErrorDetails("Could not save authentication state.")
    }
  }

  // --- RENDER LOGIC --- (Moved from page.tsx)
  let content
  if (isAuthenticated === null) {
    // Still loading initial auth status
    content = <p>Checking authentication...</p>
  } else if (isAuthenticated === true) {
    // AUTHENTICATED! Now show user info or loading tracks
    content = (
      <div className="w-full">
        {/* Show message while loading tracks OR if comparison is active but not completed */}
        {!isLoadingTracks && trackError && (
          <div
            className="bg-red-800 border border-red-600 text-red-100 px-4 py-3 rounded-lg relative mb-6 max-w-lg mx-auto"
            role="alert"
          >
            <strong className="font-bold">Track Error:</strong>
            <span className="block sm:inline ml-2">{trackError}</span>
          </div>
        )}

        {/* --- Container for potential list and overlay --- */}
        {!isLoadingTracks && !trackError && comparisonCompleted && topTracks.length > 0 && (
          <div className="relative mt-6 w-full">
            {/* Inner container for centering list content */}
            <div className="max-w-3xl">
              {/* Track List Content (always rendered when comparison done) */}
              <div className={`relative z-0`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold font-mono text-left text-yellow-400">your top 20 most played songs in the last 6 months</h3>
                  <div className="flex items-center flex-shrink-0 ml-4">
                    <span className="text-xs text-gray-400 mr-2">Data provided by</span>
                    <a href="https://www.spotify.com" target="_blank" rel="noopener noreferrer" title="Spotify">
                      <Image
                        src="/spotify-logo-green.svg"
                        alt="Spotify Logo"
                        width={70}
                        height={21}
                        unoptimized
                      />
                    </a>
                  </div>
                </div>
                <ul className="text-left">
                  {topTracks.map((track, index) => (
                    <li key={track.id} className={[
                      "flex items-center p-2 border-b border-gray-700 transition-colors duration-150", // Base styles
                      index === 0 ? 'bg-yellow-400/10 hover:bg-yellow-400/20' : '', // Gold
                      index === 1 ? 'bg-slate-400/10 hover:bg-slate-400/20' : '',  // Silver
                      index === 2 ? 'bg-amber-600/10 hover:bg-amber-600/20' : '',   // Bronze
                      index > 2 ? 'hover:bg-gray-800/50' : '', // Default hover for others
                    ].join(' ')}>
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
            </div>
          </div>
        )}
      </div>
    )
  } else {
    // Only show login if isAuthenticated is explicitly false
    content = (
      <div className="w-full">
        <p className="mb-6 text-gray-400">Compare your top tracks to see which ranked higher!</p>
        <Button
          onClick={handleLogin}
          className="font-mono bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full"
        >
          Login with Spotify to Start
        </Button>
      </div>
    )
  }

  // Get current comparison pair data safely
  const currentPair =
    isComparing && comparisonPairs.length > currentPairIndex ? comparisonPairs[currentPairIndex] : null

  // Debug Logs before render
  console.log("DEBUG Render State:", { 
      isLoadingTracks, 
      trackError, 
      comparisonCompleted, 
      isComparing,
      // showFinalScoreMessage, // Removed
      topTracksLength: topTracks.length, 
      isAuthenticated 
  });

  return (
    <div>
      {" "}
      {/* Wrapper div */}
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
      {/* --- Comparison Modal --- */}
      <Dialog open={isComparing}>
        <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-700 text-white">
          <DialogHeader className="relative">
            {" "}
            {/* Add relative positioning */}
            <DialogTitle className="font-mono pr-16">
              {" "}
              {/* Add padding to prevent overlap */}
              Pair {currentPairIndex + 1} / {comparisonPairs.length}
            </DialogTitle>
            <DialogDescription>
              Which song ranked higher in your listening?
            </DialogDescription>
          </DialogHeader>

          {/* --- Modal Body --- */}
          <div className="py-4 px-1">
            {" "}
            {/* Add padding */}
            {currentPair ? (
              // Flex container for the two choices
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch">
                {" "}
                {/* Use items-stretch */}
                {/* Track A Button/Card */}
                <button
                  onClick={() => handleAnswer(currentPair.trackA.id)}
                  disabled={isShowingFeedback} // Disable button during feedback
                  // Apply conditional styling based on feedback
                  className={`relative flex-1 bg-gray-800 p-4 rounded-lg border transition-all duration-150 flex flex-col items-center text-center \
                                  ${isShowingFeedback && answerFeedback?.correctId === currentPair.trackA.id ? "border-green-500 ring-2 ring-green-500" : ""} \
                                  ${isShowingFeedback && answerFeedback?.chosenId === currentPair.trackA.id && !answerFeedback?.isCorrect ? "border-red-500 ring-2 ring-red-500" : ""} \
                                  ${!isShowingFeedback ? "border-gray-700 hover:border-yellow-400" : "border-gray-700"} \
                                  ${isShowingFeedback ? "opacity-75" : ""}`}
                >
                  {currentPair.trackA.albumImageUrl ? (
                    <Image
                      src={currentPair.trackA.albumImageUrl}
                      alt={`Album art for ${currentPair.trackA.name}`}
                      width={150} // Increased size for modal
                      height={150}
                      className="rounded mb-3 shadow-md w-full object-cover aspect-square" // Ensure aspect ratio
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-[150px] bg-gray-700 rounded mb-3 flex items-center justify-center text-gray-500 text-sm">
                      No Image
                    </div>
                  )}
                  {/* Fixed height container for text */} 
                  <div className="h-14 w-full flex flex-col justify-center items-center overflow-hidden">
                    <p className="font-semibold text-base mb-1 truncate w-full" title={currentPair.trackA.name}>{currentPair.trackA.name}</p>
                    <p className="text-sm text-gray-400 truncate w-full" title={currentPair.trackA.artists}>{currentPair.trackA.artists}</p>
                  </div>
                </button>
                {/* Separator (optional) */}
                {/* <div className="hidden sm:block border-l border-gray-600 mx-2"></div> */}
                {/* Track B Button/Card */}
                <button
                  onClick={() => handleAnswer(currentPair.trackB.id)}
                  disabled={isShowingFeedback} // Disable button during feedback
                  // Apply conditional styling based on feedback
                  className={`relative flex-1 bg-gray-800 p-4 rounded-lg border transition-all duration-150 flex flex-col items-center text-center \
                                  ${isShowingFeedback && answerFeedback?.correctId === currentPair.trackB.id ? "border-green-500 ring-2 ring-green-500" : ""} \
                                  ${isShowingFeedback && answerFeedback?.chosenId === currentPair.trackB.id && !answerFeedback?.isCorrect ? "border-red-500 ring-2 ring-red-500" : ""} \
                                  ${!isShowingFeedback ? "border-gray-700 hover:border-yellow-400" : "border-gray-700"} \
                                  ${isShowingFeedback ? "opacity-75" : ""}`}
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
                    <div className="w-full h-[150px] bg-gray-700 rounded mb-3 flex items-center justify-center text-gray-500 text-sm">
                      No Image
                    </div>
                  )}
                  {/* Fixed height container for text */} 
                  <div className="h-14 w-full flex flex-col justify-center items-center overflow-hidden">
                    <p className="font-semibold text-base mb-1 truncate w-full" title={currentPair.trackB.name}>{currentPair.trackB.name}</p>
                    <p className="text-sm text-gray-400 truncate w-full" title={currentPair.trackB.artists}>{currentPair.trackB.artists}</p>
                  </div>
                </button>
              </div>
            ) : (
              <p>Loading comparison pair...</p>
            )}
            {/* --- Skip Button (disable during feedback?) --- */}
            <div className="mt-6 text-center">
              <button
                onClick={() => endComparison(true)} // Pass skipped=true when using the button
                disabled={isShowingFeedback} // Disable skip during feedback too
                className={`text-sm text-gray-400 hover:text-yellow-400 font-mono lowercase transition-colors duration-150 ${isShowingFeedback ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                show my full list
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
