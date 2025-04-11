import { Suspense } from 'react';
import Link from 'next/link'; // Keep Link import here for the layout
import QuizClient from './QuizClient'; // Import the new client component

// Define a simple loading fallback component
function LoadingFallback() {
  return <p>Loading quiz...</p>;
}

// This is now the main Page component (Server Component by default)
export default function QuizPage() {
  return (
    // Apply layout from song-ideas page
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
       {/* Use max-w-7xl, add padding top */} 
      <div className="w-full max-w-7xl mx-auto px-4 pt-8">
        {/* --- Sticky Header Div (remains in the layout) --- */} 
        <div className="sticky top-0 z-20 bg-black py-3 -mt-8 -mx-4 px-4 mb-4">
          <Link href="/" className="text-1xl font-mono block hover:text-yellow-400 transition-colors duration-200">
            &larr; back to home
          </Link>
        </div>
        {/* --- End Sticky Header Div --- */}

        {/* Main Title - Remains in the layout */} 
        <h2 className="text-3xl font-semibold mb-6 font-mono">Spotify Top Tracks Quiz</h2>

        {/* Suspense Boundary wrapping the Client Component */}
        <Suspense fallback={<LoadingFallback />}>
          <QuizClient />
        </Suspense>
      </div>
    </div>
  );
} 