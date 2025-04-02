/**
 * Helper functions for working with images
 */

/**
 * Determines if an image is landscape or portrait based on its dimensions
 */
export function getImageOrientation(width: number, height: number): "landscape" | "portrait" {
  return width > height ? "landscape" : "portrait"
}

/**
 * For real-world usage: Get image dimensions from a URL
 * This would be used when loading actual images from your collection
 */
export function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous" // Avoid CORS issues when using with canvas

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      })
    }

    img.onerror = () => {
      reject(new Error("Failed to load image"))
    }

    img.src = url
  })
}

/**
 * Example function for processing an array of image URLs
 * This would be used when loading your actual image collection
 */
export async function processImageCollection(imageUrls: string[]): Promise<any[]> {
  const processedImages = []

  for (let i = 0; i < imageUrls.length; i++) {
    try {
      const url = imageUrls[i]
      const { width, height } = await getImageDimensions(url)
      const orientation = getImageOrientation(width, height)

      processedImages.push({
        id: i,
        src: url,
        alt: `Gallery image ${i + 1}`,
        width,
        height,
        orientation,
      })
    } catch (error) {
      console.error(`Error processing image ${imageUrls[i]}:`, error)
      // Add a placeholder or skip this image
    }
  }

  return processedImages
}

