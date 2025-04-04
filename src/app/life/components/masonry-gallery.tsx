"use client"

import { useState, useEffect } from "react"
import GalleryImage from "./gallery-image"

interface GalleryImageData {
  id: number
  src: string
  alt: string
  width: number
  height: number
  orientation: "landscape" | "portrait"
}

// This would be replaced with your actual image data
const generatePlaceholderImages = (count: number): GalleryImageData[] => {
  return Array.from({ length: count }, (_, i) => {
    const width = Math.floor(Math.random() * 200) + 300
    const height = Math.floor(Math.random() * 200) + 300
    return {
      id: i,
      src: `/placeholder.svg?height=${height}&width=${width}`,
      alt: `Gallery image ${i + 1}`,
      width,
      height,
      orientation: width > height ? "landscape" : "portrait",
    }
  })
}

export default function MasonryGallery() {
  const [images, setImages] = useState<GalleryImageData[]>([])

  useEffect(() => {
    // In a real app, you would fetch your images from an API or data source
    setImages(generatePlaceholderImages(30))
  }, [])

  // Create column arrays for masonry layout
  const getColumns = (): GalleryImageData[][] => {
    const columns: GalleryImageData[][] = [[], [], [], []]

    images.forEach((image, index) => {
      const columnIndex = index % 4
      columns[columnIndex].push(image)
    })

    return columns
  }

  const columns = getColumns()

  return (
    <div className="w-full">
      <div className="flex gap-4">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex-1 flex flex-col gap-4">
            {column.map((image) => (
              <div 
                key={image.id} 
                className={`w-full overflow-hidden rounded-lg ${
                  image.orientation === "portrait" ? "row-span-2" : ""
                }`}
              >
                <GalleryImage
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-8">
        <button
          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          onClick={() => setImages((prev) => [...prev, ...generatePlaceholderImages(10)])}
        >
          Load More
        </button>
      </div>
    </div>
  )
}

