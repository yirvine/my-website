"use client"

import { useState, useEffect } from "react"
import GalleryImage from "./gallery-image"
import { processImageCollection } from "../utils/image-helpers"

// Generate placeholder images with deterministic dimensions
const generatePlaceholderImages = (count: number) => {
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

  useEffect(() => {
    if (useRealImages) {
      // When you have real images, list them here
      const realImageUrls = [
        "/gallery/photo1.jpg",
        "/gallery/photo2.jpg",
        // ... add more photo paths
      ]
      
      // Process the real images and update the gallery
      processImageCollection(realImageUrls).then(processedImages => {
        setImages(processedImages)
      })
    }
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

