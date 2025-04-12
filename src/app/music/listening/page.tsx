import Link from 'next/link';

export default function Listening() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
       <div className="w-full max-w-7xl mx-auto px-4 pt-8">
         <div className="sticky top-0 z-20 bg-black py-3 -mt-8 -mx-4 px-4 mb-4">
           <Link href="/" className="text-1xl font-mono block hover:text-yellow-400 transition-colors duration-200">
             &larr; back to home
           </Link>
         </div>

        <h1 className="text-3xl font-mono mb-4">songs i&apos;ve been listening to lately</h1>

        <p className="text-base text-gray-400 mb-8 max-w-prose">
          This page uses the Spotify Web API to fetch my recently played tracks. It&apos;s currently operating in development 
          mode while awaiting approval for a production quota extension from Spotify. Thanks for checking it out!
        </p>

        <p className="text-gray-500 italic">(Song list component would go here)</p>

      </div>
    </div>
  )
} 