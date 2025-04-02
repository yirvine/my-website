"use client"

import ImageGallery from "./components/image-gallery"

export default function Life() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-mono mb-8">life.jpg</h1>
        <p className="text-gray-400 mb-8">as seen on my camera roll</p>
        <ImageGallery />
      </div>
    </div>
  )
} 