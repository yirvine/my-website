import ImageGallery from "../components/image-gallery"

export default function LifePage() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-mono mb-8">Life</h1>
        <ImageGallery />
      </div>
    </div>
  )
}

