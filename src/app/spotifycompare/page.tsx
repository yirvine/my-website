import SpotifyCompareClient from "./SpotifyCompareClient"; // Updated import path and name
import Link from 'next/link'; // <-- Import Link

export default function SpotifyComparePage() { // Renamed page component
  return (
    // Revert to layout matching other pages
    <div className="min-h-screen bg-black text-white">
      {/* Use max-w-7xl, mx-auto, and standard padding */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* --- Sticky Header Div (Match other pages) --- */}
        <div className="sticky top-0 z-20 bg-black py-3 -mt-8 -mx-4 px-4 mb-4">
          <Link href="/" className="text-1xl font-mono block hover:text-yellow-400 transition-colors duration-200">
            &larr; back to home
          </Link>
        </div>
        {/* --- End Sticky Header Div --- */}
        {/* Ensure h1 is not centered */}
        <h1 className="text-3xl font-bold mb-8 font-mono">a custom spotify wrapped</h1>
        <SpotifyCompareClient />
      </div>
    </div>
  );
}