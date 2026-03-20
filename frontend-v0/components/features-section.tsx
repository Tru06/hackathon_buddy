"use client"

import { useRef, useEffect, useState } from "react"
import { 
  Search, 
  Bot, 
  Shield, 
  Users, 
  MessageCircle, 
  Megaphone,
  UserCircle,
  Calendar,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: Search,
    title: "Discover Hackathons",
    description: "Browse hundreds of hackathons. Filter by skills, location, mode, and find events matching your expertise.",
    color: "from-primary/20 to-primary/5",
    iconColor: "text-primary"
  },
  {
    icon: Bot,
    title: "AI-Powered Assistant",
    description: "Get personalized guidance from our AI. Receive project ideas, technical help, and pitch coaching.",
    color: "from-accent/20 to-accent/5",
    iconColor: "text-accent"
  },
  {
    icon: Shield,
    title: "Reliability System",
    description: "Build trust with our 4-tier badge system. Rate teammates and view trust scores before joining teams.",
    color: "from-chart-3/20 to-chart-3/5",
    iconColor: "text-chart-3"
  },
  {
    icon: Users,
    title: "Smart Synergy Matching",
    description: "Find compatible teammates with our algorithm. Match based on work style, goals, and commitment levels.",
    color: "from-chart-4/20 to-chart-4/5",
    iconColor: "text-chart-4"
  },
  {
    icon: UserCircle,
    title: "Intelligent Discovery",
    description: "AI-powered profile recommendations with skill matching. Get auto-generated personalized invitations.",
    color: "from-primary/20 to-primary/5",
    iconColor: "text-primary"
  },
  {
    icon: Calendar,
    title: "Host Your Event",
    description: "Organize hackathons effortlessly. Set requirements, manage participants, and create memorable experiences.",
    color: "from-accent/20 to-accent/5",
    iconColor: "text-accent"
  },
  {
    icon: MessageCircle,
    title: "Real-time Chat",
    description: "Chat directly with team members. Direct messaging and instant notifications keep everyone connected.",
    color: "from-chart-3/20 to-chart-3/5",
    iconColor: "text-chart-3"
  },
  {
    icon: Megaphone,
    title: "Smart Announcements",
    description: "Never miss updates. Pin important messages and notify all team members instantly.",
    color: "from-chart-4/20 to-chart-4/5",
    iconColor: "text-chart-4"
  },
]

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const Icon = feature.icon

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative p-6 rounded-2xl bg-card border border-border hover-lift cursor-default transition-all duration-500",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Gradient Background on Hover */}
      <div className={cn(
        "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        feature.color
      )} />
      
      <div className="relative z-10">
        <div className={cn(
          "w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300",
          feature.iconColor
        )}>
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
          {feature.title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {feature.description}
        </p>
      </div>
    </div>
  )
}

export function FeaturesSection() {
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
    <section id="features" className="py-24 relative" ref={sectionRef}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className={cn(
          "text-center max-w-2xl mx-auto mb-16 transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Everything You Need</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Built for <span className="gradient-text">Hackathon Success</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            All the tools and connections you need for an amazing hackathon experience.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
