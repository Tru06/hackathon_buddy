"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { getHackathons, type Hackathon } from "@/lib/api"
import { Calendar, MapPin, Users, ArrowLeft, Search, Trophy, Clock } from "lucide-react"

// Theme-based banner gradients
const THEME_GRADIENTS: Record<string, string> = {
  "AI/ML":         "from-violet-900 via-purple-800 to-indigo-900",
  "DevTools":      "from-slate-900 via-blue-900 to-cyan-900",
  "Sustainability":"from-emerald-900 via-green-800 to-teal-900",
  "FinTech":       "from-yellow-900 via-amber-800 to-orange-900",
  "HealthTech":    "from-rose-900 via-pink-800 to-red-900",
  "Web3":          "from-indigo-900 via-violet-800 to-purple-900",
  "Gaming":        "from-red-900 via-orange-800 to-yellow-900",
  "default":       "from-gray-900 via-slate-800 to-zinc-900",
}

// Theme-based SVG pattern overlays
const THEME_ICONS: Record<string, string> = {
  "AI/ML":         "🤖",
  "DevTools":      "⚙️",
  "Sustainability":"🌿",
  "FinTech":       "💰",
  "HealthTech":    "🏥",
  "Web3":          "🔗",
  "Gaming":        "🎮",
  "default":       "🏆",
}

function getStatus(h: Hackathon): { label: string; color: string } {
  const now = new Date()
  const start = new Date(h.start_date)
  const end = new Date(h.end_date)
  if (now > end) return { label: "Ended", color: "bg-gray-500" }
  if (now >= start) return { label: "Active", color: "bg-green-500" }
  const daysToStart = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysToStart <= 14) return { label: "Registering", color: "bg-green-500" }
  return { label: "Coming Soon", color: "bg-yellow-500" }
}

function getDaysLeft(h: Hackathon): number {
  const now = new Date()
  const start = new Date(h.start_date)
  const end = new Date(h.end_date)
  if (now > end) return 0
  if (now >= start) return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function HackathonBanner({ theme }: { theme?: string }) {
  const key = theme && THEME_GRADIENTS[theme] ? theme : "default"
  const gradient = THEME_GRADIENTS[key]
  const icon = THEME_ICONS[key]
  return (
    <div className={`relative h-44 bg-gradient-to-br ${gradient} overflow-hidden`}>
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl opacity-20 select-none">
        {icon}
      </div>
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  )
}

export default function HackathonsPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [filtered, setFiltered] = useState<Hackathon[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const router = useRouter()

  useEffect(() => {
    getHackathons()
      .then(data => { setHackathons(data); setFiltered(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      hackathons.filter(h =>
        h.title.toLowerCase().includes(q) ||
        h.theme?.toLowerCase().includes(q) ||
        h.location?.toLowerCase().includes(q)
      )
    )
  }, [search, hackathons])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-xl font-bold">All Hackathons</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, theme, or location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                <Skeleton className="h-44 w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hackathons found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((h, i) => {
              const status = getStatus(h)
              const daysLeft = getDaysLeft(h)
              const themes = h.theme ? h.theme.split(",").map(t => t.trim()) : []
              return (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-2xl border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 overflow-hidden flex flex-col"
                >
                  {/* Banner */}
                  <div className="relative">
                    <HackathonBanner theme={h.theme} />
                    {/* Status badge */}
                    <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full text-white ${status.color}`}>
                      {status.label}
                    </span>
                    {/* Days left */}
                    {daysLeft > 0 && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-white/90 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                        <Clock className="w-3 h-3" />
                        {daysLeft} days left
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col gap-3 flex-1">
                    <div>
                      <h2 className="font-bold text-lg leading-tight mb-1">{h.title}</h2>
                      <p className="text-sm text-muted-foreground line-clamp-2">{h.description}</p>
                    </div>

                    {/* Theme tags */}
                    {themes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {themes.map(t => (
                          <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                    )}

                    {/* Meta info */}
                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        {new Date(h.start_date).toLocaleDateString()} – {new Date(h.end_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        {h.location || "Online"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                        Max team size: {h.max_team_size}
                        {h.participants && (
                          <span className="ml-auto">{h.participants.toLocaleString()}+ hackers</span>
                        )}
                      </div>
                    </div>

                    {/* Prize */}
                    {h.prize && (
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-yellow-500">
                        <Trophy className="w-3.5 h-3.5" />
                        {h.prize}
                      </div>
                    )}

                    {/* CTA */}
                    <Button
                      variant="outline"
                      className="mt-auto w-full group"
                      onClick={() => router.push(`/hackathons/${h.id}`)}
                    >
                      View Details
                      <span className="ml-1 group-hover:translate-x-0.5 transition-transform">→</span>
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
