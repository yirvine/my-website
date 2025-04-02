"use client"

import Image from "next/image"
import Link from "next/link"
import { Menu, Twitter, Linkedin, Youtube } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Shoutbox } from "@/components/ui/shoutbox"

const projects = [
  {
    title: "RunIt",
    description: "A mobile running app built with React Native. Tracks runs, connects runners, and brings data to your stride.",
    link: "/project1",
  },
  {
    title: "Boppenheimer: The AI DJ Setlist Generator",
    description: "Cloud-based web application that leverages Spotify's web API and optimization algorithms to dynamically generate and optimize DIY-DJ set playlists.",
    link: "/project2",
  },
  {
    title: "Explainable AI in Satellite Image Classification",
    description: "A deep learning model leveraging CNNs and applying Integrated Gradients, an XAI method, to visualize an AI model's 'thinking' process in image classification.",
    link: "/project3",
  },
]

export default function Portfolio() {
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
              <p className="text-gray-400">Things I&apos;m up to...</p>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-6">
            <p className="text-gray-300 text-lg leading-relaxed">
            I&apos;m a software engineer who builds projects that mix what I&apos;m learning with what I&apos;m into — both technically and creatively.</p>
            <Button variant="outline" className="rounded-full">
              More about Me
            </Button>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="#">
                  <Twitter className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="#">
                  <Linkedin className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="#">
                  <Youtube className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="space-y-8">
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
              <Button variant="ghost" size="icon">
                <span className="sr-only">View all projects</span>→
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {projects.map((project, i) => (
                <div key={project.link} className="relative aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden group hover:bg-gray-800 transition-colors duration-300">
                  <Image 
                    src={`/images/${i + 1}.png`} 
                    alt={project.title}
                    fill 
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                    <h3 className="text-xl font-mono text-white mb-2">{project.title}</h3>
                    <p className="text-sm text-gray-300">{project.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Stack Section */}
          <section className="bg-blue-600 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-mono">Resume</h2>
              <Button variant="ghost" size="icon" className="text-white">
                <span className="sr-only">View all tools</span>→
              </Button>
            </div>
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-12 h-12 bg-white rounded-xl" />
              ))}
            </div>
          </section>

          {/* Contact and Clients Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Section */}
            <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 p-6">
              <h2 className="text-2xl font-mono mb-4">Other stuff I&apos;m up to</h2>
              <Button variant="ghost" size="icon" className="absolute right-4 top-4">
                <span className="sr-only">Contact me</span>→
              </Button>
            </section>

            {/* Happy Clients Section */}
            <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 p-6">
              <h2 className="text-2xl font-mono mb-4">Shoutbox</h2>
              <Button variant="ghost" size="icon" className="absolute right-4 top-4">
                <span className="sr-only">View all clients</span>→
              </Button>
              <Shoutbox />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

