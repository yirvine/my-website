import Link from 'next/link'

export default function PoliticalContentPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/" className="text-1xl font-mono mb-4 block hover:text-yellow-400 transition-colors duration-200">
          &larr; back to home
        </Link>
        <h1 className="text-4xl font-mono mb-8">just kidding</h1>
        <p className="text-gray-400 mb-8">
           {/* just kidding */}
        </p>
        {/* Add your actual content here later */}
      </div>
    </div>
  )
} 