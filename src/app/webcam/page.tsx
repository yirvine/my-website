"use client"

import WebcamCircles from "./WebcamCircles"
import Link from 'next/link'

export default function WebcamPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="sticky top-0 z-20 bg-black py-3 -mt-8 -mx-4 px-4 mb-4">
          <Link href="/" className="text-1xl font-mono block hover:text-yellow-400 transition-colors duration-200">
            &larr; back to home
          </Link>
        </div>
        <h1 className="text-4xl font-mono mb-8">a cool webcam</h1>
        <div className="relative w-full aspect-video overflow-hidden rounded-lg shadow-lg border border-gray-700">
          <WebcamCircles />
        </div>
        <p className="text-center text-gray-400 mt-4 text-sm">
            allow webcam access to see the effect.
        </p>
      </div>
    </div>
  )
}
