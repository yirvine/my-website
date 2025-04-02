import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const galleryPath = path.join(process.cwd(), 'public', 'gallery')
    const files = fs.readdirSync(galleryPath)
    
    // Filter for image files and remove .DS_Store
    const imageFiles = files.filter(file => 
      !file.startsWith('.') && 
      /\.(jpg|jpeg|png|webp)$/i.test(file)
    )
    
    // Convert to URLs
    const imageUrls = imageFiles.map(file => `/gallery/${file}`)
    
    return NextResponse.json({ images: imageUrls })
  } catch (error) {
    console.error('Error reading gallery directory:', error)
    return NextResponse.json({ images: [] }, { status: 500 })
  }
} 