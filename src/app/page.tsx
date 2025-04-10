"use client"

import Image from "next/image"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Shoutbox } from "@/components/ui/shoutbox"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { useEffect, useState } from 'react'

export default function Portfolio() {
  const allProjects = [
    {
      title: "RunIt",
      description: "A mobile running app built with React Native. Tracks runs, connects runners, and brings data to your stride.",
      link: "https://github.com/yirvine/runit#readme"
    },
    {
      title: "Spotify Setlist Generator",
      description: "An AI-powered tool that generates DJ setlists based on your music taste and mixing preferences.",
      link: "https://github.com/yirvine/spotify-DJ-setlist-generator#readme"
    },
    {
      title: "XAI Image Classifier",
      description: "Seeing through AI's eyes: A CNN-based model with Integrated Gradients to visualize a model's 'thinking' process in classifying satellite images",
      link: "https://github.com/yirvine/XAI-in-image-classification#readme"
    },
    {
      title: "Predicting Song Popularity with Machine Learning",
      description: "What makes a song popular? This PySpark-powered project analyzes audio features from top global artists using Spotify's Web API — and applies various ML models to predict a track's popularity.",
      link: "https://github.com/yirvine/Pop-Music-Trend-Analysis#readme"
    },
    {
      title: "Using Deep Learning to Detect Breathing Problems",
      description: "An innovative PyTorch-based 3D Convolutional Neural Network to detect breathing patterns in sleeping clients via video to promptly identify medical emergencies. Done in collaboration with University of Calgary Biometrics Lab.",
      link: "https://github.com/chvaldez10/Team-Design-Project#readme"
    },
    {
      title: "This Website",
      description: "The code behind how this portfolio was built",
      link: "https://github.com/yirvine/my-website"
    }
  ]
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([]);

  // Fetch gallery image URLs on mount
  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        const response = await fetch('/api/gallery');
        if (!response.ok) {
          throw new Error('Failed to fetch gallery images');
        }
        const data = await response.json();
        // Assuming the API returns { images: ['/gallery/img1.jpg', ...] }
        if (data && Array.isArray(data.images)) {
          setGalleryImageUrls(data.images);
        }
      } catch (error) {
        console.error("Error fetching gallery images for preload:", error);
      }
    };
    fetchGalleryImages();
  }, []);

  // Preload gallery images once URLs are fetched
  useEffect(() => {
    if (galleryImageUrls.length === 0) return;

    const preloadImages = (imageUrls: string[]) => {
      console.log(`Preloading ${imageUrls.length} images...`);
      imageUrls.forEach((url: string) => {
        // Use window.Image for browser's native image object
        const img = new window.Image();
        img.src = url;
      });
    };

    preloadImages(galleryImageUrls);
  }, [galleryImageUrls]); // Run this effect when galleryImageUrls changes

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
        {/* Left Sidebar */}
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <Image
              src="/images/profile.jpg"
              alt="Profile"
              width={60}
              height={60}
              className="rounded-full object-cover"
              priority
            />
            <div>
              <h1 className="text-2xl font-mono">YENE IRVINE</h1>
              <p className="text-gray-400">some things I made</p>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-6">
            <p className="text-gray-50 text-lg leading-relaxed text-justify">
            I&apos;m a software engineer who builds projects that mix what I&apos;m 
            learning with what I&apos;m into.</p>

            <p className="text-justify text-gray-200"> I started my career as a controls engineer, building backend tools and automation scripts for industrial systems, mainly in the 
              pharmaceutical space. That experience sparked an interest in development, which led me to 
              complete a Master&apos;s in Software Engineering at University of Calgary — and continue my career fully focused in software engineering.
            </p>
            <p className="text-justify text-gray-200"> AI, system design, and working with APIs especially interest me. Having worked 
              as a chemical engineer in the pharma space, I also maintain a strong interest in software projects that intersect with that field.
            </p>
            <p className="text-justify text-gray-200">
            Outside of software, I&apos;m big into music — I play piano and guitar, frequent live shows, and sometimes produce 
            electronic tracks. I also like to run, play soccer, and travel when I can. 
            </p>
            {/* <Button variant="outline" className="rounded-full">
              Meet the team
            </Button> */}
          </div>

          {/* Tech Stack Section (Moved Here) */}

          {/* Other Stuff (Moved to Sidebar) */}
          <div className="space-y-2">
            <h3 className="text-xl font-mono text-yellow-400 mb-3">Other stuff</h3>
            {/* Content from the 'Other stuff' card */} 
            <div className="space-y-1 font-mono text-gray-200 text-base"> 
              <Link href="/life" className="block hover:text-yellow-400 transition-colors">
                → camera roll
              </Link>
              <Link href="/listening" className="block hover:text-yellow-400 transition-colors">
                → recent listening via spotify API
              </Link>
              <Link href="/song-ideas" className="block hover:text-yellow-400 transition-colors">
                → demo songs
              </Link>
              <Link href="/webcam" className="block hover:text-yellow-400 transition-colors">
                → a cool webcam
              </Link>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="space-y-4">
          {/* Menu Button - Only show on mobile */}
          <div className="flex justify-end lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </div>

          {/* Projects Section */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-mono">Software Projects</h2>
            </div>
            <Carousel className="w-full">
              <CarouselContent className="-ml-2 md:-ml-4">
                {allProjects.map((project, i) => (
                  <CarouselItem key={i} className="pl-2 md:pl-4 md:basis-1/3">
                    <a 
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <div className="relative aspect-[3/2] bg-gray-900 rounded-lg overflow-hidden group hover:bg-gray-800 transition-colors duration-300 cursor-pointer">
                        <Image 
                          src={`/images/${i + 1}.png`}
                          alt={project.title}
                          fill 
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          loading={i < 10 ? "eager" : "lazy"}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                          <h3 className="text-xl font-mono text-white mb-2">{project.title}</h3>
                          <p className="text-sm text-gray-300">{project.description}</p>
                        </div>
                      </div>
                    </a>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2 bg-gray-900/50 hover:bg-gray-900/80 text-white h-10 w-10" />
              <CarouselNext className="right-2 bg-gray-900/50 hover:bg-gray-900/80 text-white h-10 w-10" />
            </Carousel>
          </section>

          {/* Stack Section -> Resume Section */}
          <section className="bg-blue-800 rounded-xl px-4 py-3">
            <Link 
              href="/CV-2025.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-between items-center hover:opacity-80 transition-opacity"
            >
              <h2 className="text-2xl font-mono">Download my resume</h2>
              {/* <Button variant="ghost" size="icon" className="text-white">
                <span className="sr-only">Download CV</span>→
              </Button> */}
            </Link>
          </section>

          {/* Other Stuff and Shoutbox Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Left Column: Container for stacked cards */}
            <div className="flex flex-col gap-4">
              {/* Tech Stack (Moved to Card) */}
              <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 p-3">
                <h2 className="text-2xl font-mono mb-1.5">Tech Stack</h2> {/* Title changed */} 
                {/* Content from the 'Tech Stack' sidebar section */} 
                <div className="space-y-2 text-gray-300 text-sm"> 
                  <p><span className="font-mono text-gray-100">Languages:</span> Python, JavaScript, TypeScript, SQL, Java</p>
                <p><span className="font-mono text-gray-100">Frontend:</span>React, Next.js, React Native, Tailwind CSS, HTML                  </p>
                  <p><span className="font-mono text-gray-100">Backend:</span> Node.js, FastAPI, Flask, REST APIs</p>
                  <p><span className="font-mono text-gray-100">Databases:</span> PostgreSQL, Snowflake, Firebase, Redis, DB2</p>
                  <p><span className="font-mono text-gray-100">Data & ML:</span> PyTorch, Scikit-learn, Matplotlib, Pandas, Numpy, Spark</p>
                  <p><span className="font-mono text-gray-100">Cloud/DevOps:</span> AWS, Azure, Docker, Git, Vercel</p>
                </div>
              </section>

              {/* Contact Section (Existing - should remain at bottom) */}
              <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 p-3 flex flex-col flex-grow">
                <h2 className="text-2xl font-mono mb-3">Connect</h2>
                <a 
                  href="mailto:yeneirvine@gmail.com" 
                  className="block font-mono text-gray-200 text-base hover:text-yellow-400 transition-colors mb-4"
                  style={{ fontSize: '1.1rem' }}
                >
                  yeneirvine@gmail.com
                </a>
                
                {/* Social Links - MOVED HERE */}
                <div className="mt-auto pt-4">
                  <div className="flex gap-4">
                    <Button variant="ghost" size="icon" className="p-2 transition-opacity duration-150 hover:opacity-75" asChild>
                      <Link href="https://github.com/yirvine" target="_blank" rel="noopener noreferrer">
                        <Image src="/github.svg" alt="GitHub" width={32} height={32} className="invert" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="p-2 transition-opacity duration-150 hover:opacity-75" asChild>
                      <Link href="https://www.linkedin.com/in/yene-irvine/" target="_blank" rel="noopener noreferrer">
                        <Image src="/linkedin.svg" alt="LinkedIn" width={32} height={32} className="invert" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="p-2 transition-opacity duration-150 hover:opacity-75" asChild>
                      <Link href="https://www.researchgate.net/profile/Yene-Irvine" target="_blank" rel="noopener noreferrer">
                        <Image src="/researchgate.svg" alt="ResearchGate" width={32} height={32} className="invert" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="p-2 transition-opacity duration-150 hover:opacity-75" asChild>
                      <Link href="https://instagram.com/yeneirvine" target="_blank" rel="noopener noreferrer">
                        <Image src="/instagram.svg" alt="Instagram" width={32} height={32} className="invert" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Shoutbox Section (Unchanged) */}
            <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 p-3">
              <h2 className="text-2xl font-mono mb-1.5">Say hi</h2>
              <Shoutbox />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

