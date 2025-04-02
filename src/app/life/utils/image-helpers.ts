/**
 * Helper functions for working with images
 */

type ProcessedImage = {
  url: string;
  width: number;
  height: number;
  orientation: "landscape" | "portrait";
};

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
export async function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous" // Avoid CORS issues when using with canvas

    img.onload = () => {
      console.log(`Loaded image ${url} with dimensions ${img.width}x${img.height}`);
      resolve({
        width: img.width,
        height: img.height,
      })
    }

    img.onerror = (event: Event | string) => {
      console.error(`Failed to load image ${url}:`, event)
      reject(new Error("Failed to load image"))
    }

    img.src = url
  })
}

/**
 * Example function for processing an array of image URLs
 * This would be used when loading your actual image collection
 */
export async function processImageCollection(imageUrls: string[]): Promise<ProcessedImage[]> {
  const processedImages: ProcessedImage[] = [];
  
  for (const url of imageUrls) {
    try {
      console.log(`Processing image: ${url}`);
      const dimensions = await getImageDimensions(url);
      const orientation = getImageOrientation(dimensions.width, dimensions.height);
      console.log(`Image ${url} is ${orientation}`);
      
      processedImages.push({
        url,
        ...dimensions,
        orientation,
      });
    } catch (error: unknown) {
      console.error(`Error processing image ${url}:`, error);
      // Add a placeholder with default dimensions if image fails to load
      processedImages.push({
        url,
        width: 800,
        height: 600,
        orientation: "landscape",
      });
    }
  }
  
  return processedImages;
}

