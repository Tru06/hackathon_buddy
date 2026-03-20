"use client"

import { useRef, useEffect, useState } from "react"
import { Target, Heart, Eye, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const values = [
  {
    icon: Target,
    title: "Our Mission",
    description: "To democratize innovation by connecting passionate developers, designers, and creators across the global tech ecosystem."
  },
  {
    icon: Heart,
    title: "Our Values",
    description: "Collaboration, innovation, and inclusivity drive everything we do. We celebrate diversity and believe every voice matters."
  },
  {
    icon: Eye,
    title: "Our Vision",
    description: "To become the go-to platform where breakthrough innovations are born through meaningful collaborations and hackathon experiences."
  }
]

const benefits = [
  "AI-powered hackathon mentor & guidance",
  "4-tier reliability & trust badge system",
  "Smart synergy matching algorithm",
  "Real-time communication & announcements",
  "Team feedback & rating system",
  "Intelligent profile recommendations",
  "Work style & commitment matching",
  "Comprehensive hackathon discovery",
  "Active community of 15,000+ developers",
  "Success stories from 850+ winning teams"
]

export function AboutSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section className="py-24 relative overflow-hidden" ref={sectionRef}>
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className={cn(
          "text-center max-w-3xl mx-auto mb-16 transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            About <span className="gradient-text">Hackathon Buddy</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Hackathon Buddy is a premier hackathon community platform designed to bridge the gap 
            between talented individuals and innovative opportunities. We believe that the best 
            solutions emerge when diverse minds collaborate.
          </p>
        </div>

        {/* Values Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {values.map((value, index) => {
            const Icon = value.icon
            return (
              <div
                key={value.title}
                className={cn(
                  "p-8 rounded-2xl bg-card border border-border hover-lift transition-all duration-500",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{value.description}</p>
              </div>
            )
          })}
        </div>

        {/* Why Choose Us */}
        <div className={cn(
          "bg-gradient-to-br from-secondary/50 to-card rounded-3xl p-8 md:p-12 border border-border transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}
        style={{ transitionDelay: "450ms" }}
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            Why Choose <span className="gradient-text">Hackathon Buddy</span>?
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div
                key={benefit}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl hover:bg-card/50 transition-colors",
                  isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                )}
                style={{ transitionDelay: `${500 + index * 50}ms` }}
              >
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm md:text-base">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
