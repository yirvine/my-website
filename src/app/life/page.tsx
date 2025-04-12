"use client"

import ImageGallery from "./components/image-gallery"
import Link from 'next/link'
import Aurora from '@/components/Aurora';

// Define the colors outside the component for stable reference
const auroraColorStops = ["#00D8FF", "#7CFF67", "#00D8FF"]; // CORRECTED colors

export default function Life() {
  return (
    <div className="min-h-screen bg-black text-white relative">
      <Aurora
        className="absolute inset-0 z-0 opacity-25"
        colorStops={auroraColorStops}
        blend={0.5}
        amplitude={2.0}
        speed={0.5}
      />
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <div className="sticky top-0 z-20 py-3 -mt-8 -mx-4 px-4 mb-4">
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