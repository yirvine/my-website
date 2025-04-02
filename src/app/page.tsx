"use client"

import Image from "next/image"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Shoutbox } from "@/components/ui/shoutbox"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

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
      description: "A deep learning model using CNNs and Integrated Gradients to visualize AI decision-making in image classification.",
      link: "https://github.com/yirvine/XAI-in-image-classification#readme"
    },
    {
      title: "Pop Music Trend Analysis",
      description: "A PySpark-based exploration of Spotify audio data from top global artists. This project analyzes trends and builds models to predict a song's popularity based on its musical features.",
      link: "https://github.com/yirvine/Pop-Music-Trend-Analysis#readme"
    },
    {
      title: "Detecting Breathing Irregularities with Deep Learning",
      description: "An innovative PyTorch-based 3D-Convolutional Neural Network to detect breathing patterns in sleeping clients via video to promptly identify medical emergencies. Done in collaboration with University of Calgary Biometrics Lab.",
      link: "https://github.com/chvaldez10/Team-Design-Project#readme"
    },
    {
      title: "WhoSaid",
      description: "WhoSaid description... may have to overhaul this project to make more appealing",
      link: "https://github.com/yirvine/who-said#readme"
    }
  ]

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
            <p className="text-gray-300 text-lg leading-relaxed text-justify">
            I&apos;m a software engineer who builds projects that mix what I&apos;m 
            learning with what I&apos;m into — both technically and creatively.</p>

            <p className="text-justify"> I originally graduated from Dalhousie University with a Chemical Engineering 
              degree and worked as a controls engineer, where I was exposed to 
              software development through building backend programs and scripting 
              for industrial automation systems. That experience sparked an 
              interest in development, leading me to complete a Master&apos;s in Software
              Engineering at the University of Calgary — and pivot into 
              a full-time career in software engineering.
            </p>
            <p className="text-justify"> I&apos;m especially passionate about AI, system design, and working with APIs. 
              I love building things that are both technically interesting and creatively 
              fulfilling. As much as I enjoy working on independent projects
               (like most projects on my GitHub), I&apos;m also a social person by nature and
                like bouncing ideas around and building things with others.
            </p>
            <p className="text-justify">
              Outside of work, I&apos;m into music. I play piano, guitar, and produce electronic stuff. 
              I&apos;m also into running, soccer, and traveling when I get the chance.    
            </p>
            {/* <Button variant="outline" className="rounded-full">
              Meet the team
            </Button> */}
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" className="p-2" asChild>
                <Link href="https://github.com/yirvine" target="_blank" rel="noopener noreferrer">
                  <Image src="/github.svg" alt="GitHub" width={32} height={32} className="invert" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="p-2" asChild>
                <Link href="https://www.linkedin.com/in/yene-irvine/" target="_blank" rel="noopener noreferrer">
                  <Image src="/linkedin.svg" alt="LinkedIn" width={32} height={32} className="invert" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="p-2" asChild>
                <Link href="https://www.researchgate.net/profile/Yene-Irvine" target="_blank" rel="noopener noreferrer">
                  <Image src="/researchgate.svg" alt="ResearchGate" width={32} height={32} className="invert" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="p-2" asChild>
                <Link href="https://instagram.com/yeneirvine" target="_blank" rel="noopener noreferrer">
                  <Image src="/instagram.svg" alt="Instagram" width={32} height={32} className="invert" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="space-y-6">
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
              <CarouselPrevious className="left-2 bg-gray-900/50 hover:bg-gray-900/80 text-white h-24 w-24" />
              <CarouselNext className="right-2 bg-gray-900/50 hover:bg-gray-900/80 text-white h-24 w-24" />
            </Carousel>
          </section>

          {/* Stack Section */}
          <section className="bg-blue-800 rounded-xl p-4 max-h-[70px] -mb-2">
            <Link 
              href="/CV-2025.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-between items-center hover:opacity-80 transition-opacity"
            >
              <h2 className="text-2xl font-mono">Download my CV</h2>
              <Button variant="ghost" size="icon" className="text-white">
                <span className="sr-only">Download CV</span>→
              </Button>
            </Link>
          </section>

          {/* Contact and Clients Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Section */}
            <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 p-3">
              <h2 className="text-xl font-mono mb-1.5">Other stuff I&apos;m up to</h2>
              <Button variant="ghost" size="icon" className="absolute right-2 top-2">
                <span className="sr-only">Contact me</span>→
              </Button>
              <div className="space-y-0.5 font-mono text-gray-400 text-sm">
                <p>→ there will be individual pages for each clickable line here</p>
                <p>→ music stuff.. something  with my recent work or something maybe? glorywave stuff? remixes?</p>
                <p>→ life.jpg link to an endless gallery of pg pics, landscape shots, a photo album that id be comfortable showing anyone</p>
                <p>→ songs im into, maybe ill embed like my 10 most recent liked songs on spotify and it auto updates</p>
                <p>→ political views of course</p>
              </div>
            </section>

            {/* Happy Clients Section */}
            <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 p-3">
              <h2 className="text-xl font-mono mb-1.5">Say something</h2>
              <Button variant="ghost" size="icon" className="absolute right-2 top-2">
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

