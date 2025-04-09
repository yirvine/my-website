"use client"

import ImageGallery from "./components/image-gallery"
import Link from 'next/link'

export default function Life() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="sticky top-0 z-20 bg-black py-3 -mt-8 -mx-4 px-4 mb-4">
          <Link href="/" className="text-1xl font-mono block hover:text-yellow-400 transition-colors duration-200">
            &larr; back to home
          </Link>
        </div>
        <h1 className="text-4xl font-mono mb-8">camera roll</h1>
        <p className="text-gray-400 mb-8">some pics from here and there</p>
        <ImageGallery />
      </div>
    </div>
  )
} 