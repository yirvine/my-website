"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"

interface GalleryImageProps {
  src: string
  alt: string
  width: number
  height: number
}

export default function GalleryImage({ src, alt, width, height }: GalleryImageProps) {
  const [isVisible, setIsVisible] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)

  // Determine orientation based on dimensions
  const orientation = width > height ? "landscape" : "portrait"

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

  return (
    <div
      ref={imageRef}
      className={`w-full h-full overflow-hidden bg-gray-100 ${
        orientation === "portrait" ? "aspect-[3/4]" : "aspect-[4/3]"
      }`}
    >
      <div
        className={`transition-opacity duration-700 ease-in-out ${
          isVisible ? "opacity-100" : "opacity-0"
        } h-full w-full relative`}
      >
        <Image
          src={src || "/placeholder.svg"}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover hover:scale-105 transition-transform duration-500"
        />
      </div>
    </div>
  )
}

