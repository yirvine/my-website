"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { getImageDimensions } from "../utils/image-helpers"

interface GalleryImageProps {
  src: string
  alt: string
  loading?: "eager" | "lazy"
}

export default function GalleryImage({ src, alt, loading = "lazy" }: GalleryImageProps) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let isMounted = true;
    async function fetchDimensions() {
      try {
        const dims = await getImageDimensions(src);
        if (isMounted) {
          setDimensions(dims);
        }
      } catch (err) {
        console.error(`Error fetching dimensions for ${src}:`, err);
        if (isMounted) {
          setError("Could not load image dimensions");
        }
      }
    }
    fetchDimensions();
    return () => { isMounted = false; };
  }, [src])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      {
        rootMargin: "100px",
        threshold: 0.1,
      },
    )

    const currentRef = imageRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [])

  const orientation = dimensions ? (dimensions.width > dimensions.height ? "landscape" : "portrait") : null;
  const aspectRatio = orientation === "portrait" ? "aspect-[3/4]" : "aspect-[4/3]";

  return (
    <div
      ref={imageRef}
      className={`w-full overflow-hidden bg-gray-900 rounded-lg relative transition-opacity duration-700 ease-in-out ${
        isVisible ? "opacity-100" : "opacity-0"
      } ${dimensions ? aspectRatio : 'aspect-video'}`}
      style={{ minHeight: '150px' }}
    >
      {error && <div className="absolute inset-0 flex items-center justify-center text-red-400 text-xs p-2">Error</div>}
      {!error && dimensions && (
        <Image
          src={src}
          alt={alt}
          width={dimensions.width}
          height={dimensions.height}
          loading={loading}
          className={`object-cover transition-opacity duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsImageLoaded(true)}
          onError={() => setError("Failed to load image")}
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      )}
      {!error && !dimensions && (
         <div className="absolute inset-0 bg-gray-800 animate-pulse"></div>
      )}
    </div>
  )
}

