"use client"

import WebcamCircles from "./WebcamCircles"
import Link from 'next/link'

export default function WebcamPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/" className="text-1xl font-mono mb-4 block hover:text-yellow-400 transition-colors duration-200">
          &larr; back to home
        </Link>
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
