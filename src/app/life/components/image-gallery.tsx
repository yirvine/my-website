"use client"

import { useState, useEffect } from "react"
import GalleryImage from "./gallery-image"
import { processImageCollection } from "../utils/image-helpers"

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

export default function ImageGallery({ useRealImages = false }: { useRealImages?: boolean }) {
  const [images, setImages] = useState<GalleryImage[]>(generatePlaceholderImages(12))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadGalleryImages() {
      if (!useRealImages) return

      try {
        setLoading(true)
        setError(null)
        
        // Fetch list of images from our API
        const response = await fetch('/api/gallery')
        const data = await response.json()
        
        if (!response.ok) throw new Error('Failed to load gallery')
        
        // Process the images to get their dimensions and orientation
        const processedImages = await processImageCollection(data.images)
        
        // Transform ProcessedImage to GalleryImage
        const galleryImages: GalleryImage[] = processedImages.map((img, index) => ({
          id: index,
          src: img.url,
          alt: `Gallery image ${index + 1}`,
          width: img.width,
          height: img.height,
          orientation: img.orientation
        }))
        
        setImages(galleryImages)
      } catch (err) {
        console.error('Error loading gallery:', err)
        setError('Failed to load gallery images')
      } finally {
        setLoading(false)
      }
    }

    loadGalleryImages()
  }, [useRealImages])

  const loadMorePlaceholders = () => {
    if (!useRealImages) {
      const currentLength = images.length
      const newImages = generatePlaceholderImages(6).map(img => ({
        ...img,
        id: img.id + currentLength
      }))
      setImages(prev => [...prev, ...newImages])
    }
  }

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
        {images.map((image) => {
          const orientation = image.orientation || (image.width > image.height ? "landscape" : "portrait")
          return (
            <div
              key={image.id}
              className={`${orientation === "portrait" ? "row-span-2" : "col-span-1"} overflow-hidden rounded-lg`}
            >
              <GalleryImage src={image.src} alt={image.alt} width={image.width} height={image.height} />
            </div>
          )
        })}
      </div>

      {!useRealImages && (
        <div className="flex justify-center mt-8">
          <button
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            onClick={loadMorePlaceholders}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  )
}

