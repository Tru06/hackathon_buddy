"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Users, Trophy, Rocket } from "lucide-react"
import { cn } from "@/lib/utils"

const typingWords = ["Perfect Team", "Dream Partner", "Winning Squad", "Tech Family"]

export function HeroSection() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [displayText, setDisplayText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentWord = typingWords[currentWordIndex]
    const typingSpeed = isDeleting ? 50 : 100

    if (!isDeleting && displayText === currentWord) {
      setTimeout(() => setIsDeleting(true), 2000)
      return
    }

    if (isDeleting && displayText === "") {
      setIsDeleting(false)
      setCurrentWordIndex((prev) => (prev + 1) % typingWords.length)
      return
    }

    const timeout = setTimeout(() => {
      setDisplayText((prev) =>
        isDeleting ? prev.slice(0, -1) : currentWord.slice(0, prev.length + 1)
      )
    }, typingSpeed)

    return () => clearTimeout(timeout)
  }, [displayText, isDeleting, currentWordIndex])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-grid-pattern" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background" />
      
      {/* Floating Elements */}
      <div className="absolute top-1/4 left-[10%] w-20 h-20 rounded-full bg-primary/10 blur-2xl animate-float" />
      <div className="absolute top-1/3 right-[15%] w-32 h-32 rounded-full bg-accent/10 blur-3xl animate-float animation-delay-200" />
      <div className="absolute bottom-1/4 left-[20%] w-24 h-24 rounded-full bg-chart-3/10 blur-2xl animate-float animation-delay-400" />

      {/* Decorative Orbs */}
      <div className="absolute top-[20%] right-[10%] hidden lg:block">
        <div className="relative">
          <div className="w-64 h-64 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl animate-pulse-glow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="glass rounded-2xl p-6 animate-float">
              <Users className="w-8 h-8 text-primary mb-2" />
              <p className="text-sm font-medium">15,000+</p>
              <p className="text-xs text-muted-foreground">Active Developers</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[25%] left-[8%] hidden lg:block">
        <div className="glass rounded-2xl p-4 animate-float animation-delay-300">
          <Trophy className="w-6 h-6 text-accent mb-1" />
          <p className="text-sm font-medium">850+</p>
          <p className="text-xs text-muted-foreground">Wins</p>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">AI-Powered Team Matching</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-slide-up">
            Find Your
            <br />
            <span className="gradient-text min-h-[1.2em] inline-block">
              {displayText}
              <span className="animate-pulse">|</span>
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up animation-delay-100">
            Connect with talented developers, designers, and innovators. 
            Build winning teams with smart skill matching and discover exciting hackathons.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up animation-delay-200">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-full group"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-6 text-lg rounded-full border-border hover:bg-secondary"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Explore Hackathons
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 animate-slide-up animation-delay-300">
            {[
              { value: "10+", label: "Active Hackathons" },
              { value: "15,000+", label: "Developers" },
              { value: "3,200+", label: "Teams Formed" },
              { value: "850+", label: "Success Stories" },
            ].map((stat, index) => (
              <div 
                key={stat.label}
                className={cn(
                  "p-4 rounded-2xl glass hover-lift cursor-default",
                  `animation-delay-${(index + 3) * 100}`
                )}
              >
                <p className="text-2xl md:text-3xl font-bold gradient-text">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
