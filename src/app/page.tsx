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
            <p> yada yada chemical engineer worked as a controls engineer graduated from Dalhousie with a nasty gpa buddy also obtained a masters in software engineering pivoted into this field blabla i literally love AI and im sick at it and working with APIs and system design and IM PERSONABLE cant forget that also im super random!</p>
              
              <p> im currently a developer with a 3PL company i love music i play piano and guitar and oh yea ive been producing it for YEARS im also into running and soccer and travelling (lol) and that and my life story</p>
            <Button variant="outline" className="rounded-full">
              Meet the team (lol just links to a pic of me)
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
                <a 
                  key={project.link} 
                  href={[
                    "https://github.com/yirvine/runit#readme",
                    "https://github.com/yirvine/spotify-DJ-setlist-generator#readme",
                    "https://github.com/yirvine/XAI-in-image-classification#readme"
                  ][i]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="relative aspect-[2/1] bg-gray-900 rounded-lg overflow-hidden group hover:bg-gray-800 transition-colors duration-300 cursor-pointer">
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
                </a>
              ))}
            </div>
          </section>

          {/* Stack Section */}
          <section className="bg-blue-800 rounded-xl p-6 max-h-[80px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-mono">Resume</h2>
              <Button variant="ghost" size="icon" className="text-white">
                <span className="sr-only">View all tools</span>→
              </Button>
            </div>
            <div className="flex gap-4">
              {/* {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-12 h-12 bg-white rounded-xl" />
              ))} */}
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
              <div className="space-y-2 font-mono text-gray-400">
                <p>→ Music Production</p>
                <p>→ pics of life? like an endless gallery of funny but PG pics, cool pics, landscape shots, a photo album that id be comfortable showing anyone</p>
                <p>→ could show off and embed like 10 songs im really into rn or something, that would be on its own page though..</p>
                <p>→ Could include stuff like songs im learning on piano or something idk</p>
                <p>→ not end of the world if i make these individual pages for each thing and its clickable, it doesnt need to be super advertised u know</p>
                <p>→ political views</p>
              </div>
            </section>

            {/* Happy Clients Section */}
            <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 p-6">
              <h2 className="text-2xl font-mono mb-4">Say something</h2>
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

