import ImageGallery from "@/components/image-gallery"

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">Photo Gallery</h1>
        <p className="text-gray-600 mb-8 text-center max-w-2xl mx-auto">
          A collection of memorieeees and moments captured through the lens.
        </p>

        {/* You can pass your real image URLs here */}
        <ImageGallery
        // Example: imageUrls={['url1.jpg', 'url2.jpg', ...]}
        />
      </div>
    </main>
  )
}

