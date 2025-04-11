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

// Define structure for a quiz question pair
interface QuizQuestion {
  trackA: Track
  trackB: Track
}

// Component containing all the client-side logic
export default function QuizClient() {
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

  // --- NEW Quiz State ---
  const [isQuizActive, setIsQuizActive] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)
  // --- NEW Feedback State ---
  const [answerFeedback, setAnswerFeedback] = useState<{
    chosenId: string
    correctId: string
    isCorrect: boolean
  } | null>(null)
  const [isShowingFeedback, setIsShowingFeedback] = useState(false)
  // --- End Feedback State ---
  // --- NEW Score State ---
  const [score, setScore] = useState(0)
  const [showScore, setShowScore] = useState(false) // State to control score visibility
  const [displayedDenominator, setDisplayedDenominator] = useState(0) // State for the displayed denominator
  const [showFinalScoreMessage, setShowFinalScoreMessage] = useState(false) // State for final score message

  // Helper function for score messages
  const getScoreMessage = (finalScore: number, totalQuestions: number): string => {
    if (totalQuestions === 0) return "Quiz Complete!" // Handle edge case
    const percentage = (finalScore / totalQuestions) * 100

    if (percentage === 100) return "Perfect score! You really know your music!"
    if (percentage >= 80) return "Impressive! You're a true fan of your playlist."
    if (percentage >= 60) return "Well done! You know your music pretty well."
    if (percentage >= 40) return "Not bad! You've got a decent ear for your favorites."
    if (percentage >= 20) return "Room for improvement, but you're getting there!"
    return "Time to rediscover your playlist!"
  }

  // Ref to track if initial auth redirect has been processed
  const hasProcessedAuthRef = useRef(false)

  // --- DEFINE QUIZ LOGIC FIRST ---
  // Wrap startQuiz in useCallback for stable identity
  const startQuiz = useCallback((tracks: Track[]) => {
    console.log("DEBUG: startQuiz function called.")
    // Reset score and visibility
    setScore(0)
    setShowScore(false)
    setDisplayedDenominator(0)
    setShowFinalScoreMessage(false)

    // Ensure enough tracks for the special final question logic + 4 other questions
    if (tracks.length < 10) {
      console.error("Not enough tracks for quiz structure (need 10).")
      setTrackError("Not enough track data to start the quiz.")
      setIsQuizActive(false)
      setQuizCompleted(true) // Mark as complete if cannot start
      return
    }

    const track1 = tracks[0]
    const track2 = tracks[1]
    const remainingTracks = tracks.slice(2)
    const shuffledRemaining = shuffleArray([...remainingTracks])

    const ARTIST_TRUNCATE_LENGTH = 30;

    // We need 8 tracks for the first 4 questions
    const selectedRemaining = shuffledRemaining.slice(0, 8);

    const firstFourQuestions: QuizQuestion[] = [];
    for (let i = 0; i < 8; i += 2) {
        const trackA_orig = selectedRemaining[i];
        const trackB_orig = selectedRemaining[i+1];
        firstFourQuestions.push({
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

    // Randomize order for the final question, also applying truncation
    const finalQuestionTracks = Math.random() < 0.5 ? [track1, track2] : [track2, track1];
    const finalQ_trackA_orig = finalQuestionTracks[0];
    const finalQ_trackB_orig = finalQuestionTracks[1];

    const finalQuestion: QuizQuestion = {
        trackA: {
            ...finalQ_trackA_orig,
            artists: finalQ_trackA_orig.artists.length > ARTIST_TRUNCATE_LENGTH
                ? finalQ_trackA_orig.artists.substring(0, ARTIST_TRUNCATE_LENGTH) + '...'
                : finalQ_trackA_orig.artists
        },
        trackB: {
            ...finalQ_trackB_orig,
            artists: finalQ_trackB_orig.artists.length > ARTIST_TRUNCATE_LENGTH
                ? finalQ_trackB_orig.artists.substring(0, ARTIST_TRUNCATE_LENGTH) + '...'
                : finalQ_trackB_orig.artists
        }
    };

    const questions = [...firstFourQuestions, finalQuestion];

    setQuizQuestions(questions)
    setCurrentQuestionIndex(0)
    setIsQuizActive(true)
    setQuizCompleted(false)
    setTrackError(null)
  }, []) // Empty dependency array - relies only on passed argument

  const endQuiz = (skipped = false) => {
    // Reset feedback state when ending quiz
    setIsShowingFeedback(false)
    setAnswerFeedback(null)
    console.log("Quiz finished!")
    setIsQuizActive(false)
    setQuizCompleted(true)

    // Show final score message only if quiz was completed normally (not skipped)
    if (!skipped && quizQuestions.length > 0) {
      // Check length to avoid division by zero
      setShowFinalScoreMessage(true)
      setTimeout(() => {
        setShowFinalScoreMessage(false)
      }, 2500) // Show message for 2.5 seconds
    }
  }

  const handleAnswer = (chosenTrackId: string) => {
    if (isShowingFeedback) return // Prevent double clicks during feedback

    const currentQ = quizQuestions[currentQuestionIndex]
    if (!currentQ) return // Should not happen

    // Find original indices
    const indexA = topTracks.findIndex((t) => t.id === currentQ.trackA.id)
    const indexB = topTracks.findIndex((t) => t.id === currentQ.trackB.id)

    // Determine correct answer (lower index is higher rank)
    let correctId: string
    if (indexA === -1 && indexB === -1) {
      console.error("Couldn't find either track in original list for feedback")
      correctId = "error" // Handle error case
    } else if (indexA === -1) {
      correctId = currentQ.trackB.id // B must be correct if A not found
    } else if (indexB === -1) {
      correctId = currentQ.trackA.id // A must be correct if B not found
    } else {
      correctId = indexA < indexB ? currentQ.trackA.id : currentQ.trackB.id
    }

    const isCorrect = chosenTrackId === correctId

    // Update score if correct
    if (isCorrect) {
      setScore((prevScore) => prevScore + 1)
    }

    // Set feedback state
    setAnswerFeedback({ chosenId: chosenTrackId, correctId: correctId, isCorrect })
    setIsShowingFeedback(true)
    setShowScore(true) // Make score visible after first answer
    setDisplayedDenominator(currentQuestionIndex + 1) // Set denominator when feedback starts

    // Wait before proceeding
    setTimeout(() => {
      setIsShowingFeedback(false)
      setAnswerFeedback(null)

      const nextIndex = currentQuestionIndex + 1
      if (nextIndex < quizQuestions.length) {
        setCurrentQuestionIndex(nextIndex)
      } else {
        endQuiz() // Call endQuiz (without skipped=true) after timeout if last question
      }
    }, 1000) // 1 second delay
  }
  // --- END QUIZ LOGIC ---

  // --- FETCH TRACKS (depends on startQuiz having stable identity) ---
  const fetchTopTracks = useCallback(
    async (token: string | null) => {
      if (!token) {
        console.error("fetchTopTracks called without a token.")
        setTrackError("Authentication token is missing.")
        console.log("DEBUG: fetchTopTracks setting isAuthenticated = false (no token)")
        setIsAuthenticated(false)
        setIsQuizActive(false)
        setQuizCompleted(false)
        setIsShowingFeedback(false)
        setAnswerFeedback(null) // Reset on error
        setScore(0) // Reset score on fetch error
        setShowScore(false) // Reset score visibility
        setDisplayedDenominator(0) // Reset denominator
        setShowFinalScoreMessage(false)
        return
      }
      setIsLoadingTracks(true)
      setTrackError(null)
      setTopTracks([])
      try {
        const res = await fetch("/api/spotify/quiz/top-tracks", {
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
            setIsQuizActive(false)
            setQuizCompleted(false)
            setIsShowingFeedback(false)
            setAnswerFeedback(null) // Reset on error
            setScore(0) // Reset score on auth error
            setShowScore(false) // Reset score visibility
            setDisplayedDenominator(0) // Reset denominator
            setShowFinalScoreMessage(false)
          } else {
            throw new Error(data.error || `HTTP error! status: ${res.status}`)
          }
        } else {
          const fetchedTracks = data.tracks || []
          setTopTracks(fetchedTracks)
          setError(null)
          setErrorDetails(null)
          setIsQuizActive(false)
          setQuizQuestions([])
          setCurrentQuestionIndex(0)
          setQuizCompleted(false)
          setIsShowingFeedback(false)
          setAnswerFeedback(null) // Reset on success before start
          // Reset score and visibility before potentially starting a new quiz
          setScore(0)
          setShowScore(false)
          setDisplayedDenominator(0)
          setShowFinalScoreMessage(false)

          if (fetchedTracks.length >= 10) {
            console.log("DEBUG: Tracks fetched, automatically starting quiz.")
            startQuiz(fetchedTracks) // Now calls the stable startQuiz function
          } else {
            console.log("DEBUG: Not enough tracks to start quiz, marking as complete.")
            setTrackError("Not enough track data to start the quiz.")
            setQuizCompleted(true)
            // Set score to 0 even if quiz doesn't start
            // setScore(0); // Already set above
          }
        }
      } catch (e) {
        console.error("Failed to fetch top tracks:", e)
        setTrackError(e instanceof Error ? e.message : "An unknown error occurred while fetching tracks.")
        setError(null)
        setErrorDetails(null)
        setIsQuizActive(false)
        setQuizCompleted(false)
        setIsShowingFeedback(false)
        setAnswerFeedback(null) // Reset on error
        setScore(0) // Reset score on fetch error
        setShowScore(false) // Reset score visibility
        setDisplayedDenominator(0) // Reset denominator
        setShowFinalScoreMessage(false)
      } finally {
        setIsLoadingTracks(false)
      }
    },
    [startQuiz],
  ) // Dependency: startQuiz (now stable due to useCallback)

  // --- Auth Effect (depends on fetchTopTracks having stable identity) ---
  useEffect(() => {
    let isMounted = true
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
          setTimeout(() => router.replace("/quiz", { scroll: false }), 0)
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
        setIsQuizActive(false)
        // Mark auth as processed (even on error)
        hasProcessedAuthRef.current = true
        console.log("DEBUG: Set hasProcessedAuthRef to true (error).")
        setTimeout(() => router.replace("/quiz", { scroll: false }), 0)
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
    // Add state to login URL query parameters
    const loginUrl = `/api/spotify/quiz/login?state=${encodeURIComponent(state)}`

    try {
      // Restore sessionStorage logic
      sessionStorage.setItem("spotify_auth_state_quiz", state)
      const storedValue = sessionStorage.getItem("spotify_auth_state_quiz")
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
        {/* Show message while loading tracks OR if quiz is active but not completed */}
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
        {!isLoadingTracks && !trackError && quizCompleted && topTracks.length > 0 && (
          <div className="relative mt-6 w-full">
            {/* Inner container for centering list content */}
            <div className="max-w-3xl">
              {/* Track List Content (always rendered when quiz done) */}
              <div className={`relative z-0 transition-opacity duration-300 ${showFinalScoreMessage ? 'opacity-30' : 'opacity-100'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold font-mono text-left text-yellow-400">your top 20 most played songs in the last 6 months</h3>
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

            {/* Final Score Result Dialog */}
            {showFinalScoreMessage && (
              <div className="absolute inset-0 z-10 flex items-start justify-center p-4 pt-16">
                <div className="bg-gray-800 border border-gray-700 p-8 rounded-xl text-center shadow-xl max-w-sm transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                  <div className="mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-900 mb-4">
                      <span className="text-2xl font-bold text-lime-400">
                        {score}/{quizQuestions.length}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-white">Quiz Complete!</h3>
                  <p className="text-xl font-mono mb-6 text-lime-300">{getScoreMessage(score, quizQuestions.length)}</p>
                  <p className="text-gray-400 text-sm">Your top tracks are loading below...</p>
                  <div className="mt-4 flex justify-center">
                    <div className="flex space-x-2">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-300"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  } else {
    // Only show login if isAuthenticated is explicitly false
    content = (
      <div className="w-full">
        <p className="mb-6 text-gray-400">Find out which of your own songs you listened to more!</p>
        <Button
          onClick={handleLogin}
          className="font-mono bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full"
        >
          Login with Spotify to Start
        </Button>
      </div>
    )
  }

  // Get current question data safely
  const currentQuestion =
    isQuizActive && quizQuestions.length > currentQuestionIndex ? quizQuestions[currentQuestionIndex] : null

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
      {/* --- Quiz Modal --- */}
      <Dialog open={isQuizActive}>
        <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-700 text-white">
          <DialogHeader className="relative">
            {" "}
            {/* Add relative positioning */}
            <DialogTitle className="font-mono pr-16">
              {" "}
              {/* Add padding to prevent overlap */}
              Question {currentQuestionIndex + 1} / {quizQuestions.length}
            </DialogTitle>
            <DialogDescription>Which song do you think you listened to more?</DialogDescription>
            {/* Score Display (conditional) */}
            {showScore && (
              <div className="absolute top-4 right-4 text-sm font-mono text-gray-400">
                Score: {score} / {displayedDenominator}
              </div>
            )}
          </DialogHeader>

          {/* --- Modal Body --- */}
          <div className="py-4 px-1">
            {" "}
            {/* Add padding */}
            {currentQuestion ? (
              // Flex container for the two choices
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch">
                {" "}
                {/* Use items-stretch */}
                {/* Track A Button/Card */}
                <button
                  onClick={() => handleAnswer(currentQuestion.trackA.id)}
                  disabled={isShowingFeedback} // Disable button during feedback
                  // Apply conditional styling based on feedback
                  className={`relative flex-1 bg-gray-800 p-4 rounded-lg border transition-all duration-150 flex flex-col items-center text-center \
                                  ${isShowingFeedback && answerFeedback?.correctId === currentQuestion.trackA.id ? "border-green-500 ring-2 ring-green-500" : ""} \
                                  ${isShowingFeedback && answerFeedback?.chosenId === currentQuestion.trackA.id && !answerFeedback?.isCorrect ? "border-red-500 ring-2 ring-red-500" : ""} \
                                  ${!isShowingFeedback ? "border-gray-700 hover:border-yellow-400" : "border-gray-700"} \
                                  ${isShowingFeedback ? "opacity-75" : ""}`}
                >
                  {currentQuestion.trackA.albumImageUrl ? (
                    <Image
                      src={currentQuestion.trackA.albumImageUrl || "/placeholder.svg"}
                      alt={`Album art for ${currentQuestion.trackA.name}`}
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
                    <p className="font-semibold text-base mb-1 truncate w-full" title={currentQuestion.trackA.name}>{currentQuestion.trackA.name}</p>
                    <p className="text-sm text-gray-400 truncate w-full" title={currentQuestion.trackA.artists}>{currentQuestion.trackA.artists}</p>
                  </div>
                  {/* --- Feedback Text --- */}
                  {isShowingFeedback && answerFeedback?.chosenId === currentQuestion.trackA.id && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-mono font-bold z-10">
                      {answerFeedback.isCorrect ? (
                        <span className="text-lime-400">correct</span>
                      ) : (
                        <span className="text-red-500">incorrect</span>
                      )}
                    </div>
                  )}
                </button>
                {/* Separator (optional) */}
                {/* <div className="hidden sm:block border-l border-gray-600 mx-2"></div> */}
                {/* Track B Button/Card */}
                <button
                  onClick={() => handleAnswer(currentQuestion.trackB.id)}
                  disabled={isShowingFeedback} // Disable button during feedback
                  // Apply conditional styling based on feedback
                  className={`relative flex-1 bg-gray-800 p-4 rounded-lg border transition-all duration-150 flex flex-col items-center text-center \
                                  ${isShowingFeedback && answerFeedback?.correctId === currentQuestion.trackB.id ? "border-green-500 ring-2 ring-green-500" : ""} \
                                  ${isShowingFeedback && answerFeedback?.chosenId === currentQuestion.trackB.id && !answerFeedback?.isCorrect ? "border-red-500 ring-2 ring-red-500" : ""} \
                                  ${!isShowingFeedback ? "border-gray-700 hover:border-yellow-400" : "border-gray-700"} \
                                  ${isShowingFeedback ? "opacity-75" : ""}`}
                >
                  {currentQuestion.trackB.albumImageUrl ? (
                    <Image
                      src={currentQuestion.trackB.albumImageUrl || "/placeholder.svg"}
                      alt={`Album art for ${currentQuestion.trackB.name}`}
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
                    <p className="font-semibold text-base mb-1 truncate w-full" title={currentQuestion.trackB.name}>{currentQuestion.trackB.name}</p>
                    <p className="text-sm text-gray-400 truncate w-full" title={currentQuestion.trackB.artists}>{currentQuestion.trackB.artists}</p>
                  </div>
                  {/* --- Feedback Text --- */}
                  {isShowingFeedback && answerFeedback?.chosenId === currentQuestion.trackB.id && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-mono font-bold z-10">
                      {answerFeedback.isCorrect ? (
                        <span className="text-lime-400">correct</span>
                      ) : (
                        <span className="text-red-500">incorrect</span>
                      )}
                    </div>
                  )}
                </button>
              </div>
            ) : (
              <p>Loading question...</p>
            )}
            {/* --- Skip Button (disable during feedback?) --- */}
            <div className="mt-6 text-center">
              <button
                onClick={() => endQuiz(true)} // Pass skipped=true when using the button
                disabled={isShowingFeedback} // Disable skip during feedback too
                className={`text-sm text-gray-400 hover:text-yellow-400 font-mono lowercase transition-colors duration-150 ${isShowingFeedback ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                skip the quiz, show me my spotify wrapped
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
