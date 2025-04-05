"use client"

import { useState, useEffect } from "react"
import GalleryImage from "./gallery-image"
import { getImageDimensions } from "../utils/image-helpers" // Re-import helper

// Combined type for image data including dimensions
interface GalleryImageData {
  id: number | string // Use index or URL as ID
  src: string
  alt: string
  width: number
  height: number
  orientation: "landscape" | "portrait"
}

export default function ImageGallery() {
  // State for the final image data including dimensions
  const [images, setImages] = useState<GalleryImageData[]>([])
  // State just for the initial list of URLs
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [loadingUrls, setLoadingUrls] = useState(true)
  // const [loadingDimensions, setLoadingDimensions] = useState(false) // REMOVE UNUSED STATE
  const [error, setError] = useState<string | null>(null)

  // Effect 1: Fetch initial list of image URLs
  useEffect(() => {
    async function loadGalleryUrls() {
      try {
        setError(null)
        setLoadingUrls(true)
        const response = await fetch('/api/gallery')
        if (!response.ok) throw new Error('Failed to fetch gallery URLs');
        const data = await response.json()
        if (data && Array.isArray(data.images)) {
          setImageUrls(data.images)
        } else {
          throw new Error('Invalid image data format from API');
        }
      } catch (err: unknown) {
        console.error('Error loading gallery URLs:', err)
        const message = err instanceof Error ? err.message : 'Failed to load gallery URLs';
        setError(message)
      } finally {
        setLoadingUrls(false)
      }
    }
    loadGalleryUrls()
  }, [])

  // Effect 2: Fetch dimensions once URLs are loaded
  useEffect(() => {
    if (imageUrls.length === 0) return; // Don't run if no URLs

    async function fetchAllDimensions() {
      // setLoadingDimensions(true) // REMOVE USAGE
      setError(null) // Clear previous errors
      try {
        console.log(`Fetching dimensions for ${imageUrls.length} images...`);
        // Fetch all dimensions in parallel
        const dimensionPromises = imageUrls.map(url => getImageDimensions(url));
        const dimensionsResults = await Promise.allSettled(dimensionPromises);

        const loadedImages: GalleryImageData[] = [];
        dimensionsResults.forEach((result, index) => {
          const url = imageUrls[index];
          if (result.status === 'fulfilled') {
            const { width, height } = result.value;
            const orientation = width > height ? "landscape" : "portrait";
            loadedImages.push({
              id: url, // Use URL as unique ID
              src: url,
              alt: `Gallery image ${index + 1}`,
              width,
              height,
              orientation
            });
          } else {
            console.error(`Failed to get dimensions for ${url}:`, result.reason);
            // Optionally: add a placeholder or skip
            // For now, we skip images that fail dimension loading
          }
        });
        console.log(`Successfully got dimensions for ${loadedImages.length} images.`);
        setImages(loadedImages);

      } catch (err: unknown) {
        // This catch might be less likely if Promise.allSettled is used
        console.error('Error in fetchAllDimensions:', err)
        const message = err instanceof Error ? err.message : 'Failed to process image dimensions';
        setError(message)
      } finally {
        // setLoadingDimensions(false) // REMOVE USAGE
      }
    }

    fetchAllDimensions();
  }, [imageUrls]) // Re-run if imageUrls change

  // Show main loading indicator only while fetching URLs or if dimensions haven't started
  if (loadingUrls || (imageUrls.length > 0 && images.length === 0 && !error)) {
    return (
      <div className="w-full text-center py-20">
        <p className="text-gray-400">Loading gallery...</p>
      </div>
    )
  }

  if (error && images.length === 0) { // Show error only if we couldn't load any images
    return (
      <div className="w-full text-center py-20">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  // Render placeholders if URLs are loaded but dimensions are still fetching
  const renderPlaceholders = imageUrls.length > 0 && images.length === 0 && !error;

  return (
    <div className="w-full">
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {(renderPlaceholders ? imageUrls : images).map((item, index) => {
          if (renderPlaceholders) {
            // Render simple placeholder divs - add break-inside-avoid
            return (
              <div
                key={item as string} // item is URL string here
                className="aspect-video bg-gray-800 rounded-lg animate-pulse break-inside-avoid" // Added break-inside-avoid
                style={{ minHeight: '150px' }}
              ></div>
            );
          } else {
            // Render actual GalleryImage component with data
            const image = item as GalleryImageData;
            return (
              // Remove row-span logic, add break-inside-avoid
              <div
                key={image.id}
                className="overflow-hidden rounded-lg break-inside-avoid" // Removed conditional class, added break-inside-avoid
              >
                <GalleryImage
                  src={image.src}
                  alt={image.alt}
                  width={image.width}   // Pass width
                  height={image.height} // Pass height
                  loading={index < 8 ? "eager" : "lazy"} // Apply lazy/eager loading
                />
              </div>
            )
          }
        })}
      </div>
    </div>
  )
}

