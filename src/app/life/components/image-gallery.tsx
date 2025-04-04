"use client"

import { useState, useEffect } from "react"
import GalleryImage from "./gallery-image"

// Generate placeholder images with deterministic dimensions
const generatePlaceholderImages = (count: number): GalleryImage[] => {
  return Array.from({ length: count }, (_, i) => {
    // Use index to generate deterministic dimensions
    const isPortrait = i % 2 === 0
    const width = isPortrait ? 400 : 600
    const height = isPortrait ? 600 : 400

    return {
      id: i,
      src: `/placeholder.svg?height=${height}&width=${width}`,
      alt: `Gallery image ${i + 1}`,
      width,
      height,
      orientation: isPortrait ? "portrait" : "landscape"
    }
  })
}

interface GalleryImage {
  id: number
  src: string
  alt: string
  width: number
  height: number
  orientation?: "landscape" | "portrait"
}

interface GalleryImageProps {
  src: string
  alt: string
}

export default function ImageGallery() {
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadGalleryUrls() {
      try {
        setError(null)
        setLoading(true) // Ensure loading is true at the start
        
        // Fetch list of image URLs from our API
        const response = await fetch('/api/gallery')
        if (!response.ok) {
          throw new Error('Failed to fetch gallery URLs');
        }
        const data = await response.json()

        // Assuming the API returns { images: ['/gallery/img1.jpg', ...] }
        if (data && Array.isArray(data.images)) {
          setImageUrls(data.images)
        } else {
          throw new Error('Invalid image data format from API');
        }

      } catch (err: any) { // Type error explicitly
        console.error('Error loading gallery URLs:', err)
        setError(err.message || 'Failed to load gallery images')
      } finally {
        setLoading(false)
      }
    }

    loadGalleryUrls()
  }, [])

  if (loading) {
    return (
      <div className="w-full text-center py-20">
        <p className="text-gray-400">Loading gallery...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full text-center py-20">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {imageUrls.map((url, index) => {
          // We don't know orientation here yet, GalleryImage will handle its aspect ratio
          return (
            <div
              key={url} // Use URL as key since it's unique
              // Remove dynamic row-span for now, can be added back inside GalleryImage if needed
              className={`col-span-1 overflow-hidden rounded-lg`}
            >
              {/* Pass loading prop here */}
              <GalleryImage 
                src={url} 
                alt={`Gallery image ${index + 1}`} 
                loading={index < 8 ? "eager" : "lazy"} // Load first 8 eagerly
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

