"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getHackathonById, registerInterest, removeInterest, type Hackathon } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import {
  Calendar, MapPin, Users, ArrowLeft, Trophy, ExternalLink, Star, StarOff,
} from "lucide-react"

export default function HackathonDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [hackathon, setHackathon] = useState<Hackathon | null>(null)
  const [loading, setLoading] = useState(true)
  const [interested, setInterested] = useState(false)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    getHackathonById(id)
      .then(setHackathon)
      .catch(() => router.push("/hackathons"))
      .finally(() => setLoading(false))
  }, [id, router])

  async function toggleInterest() {
    if (!isAuthenticated) { router.push("/login"); return }
    setToggling(true)
    try {
      if (interested) {
        await removeInterest(id)
        setInterested(false)
      } else {
        await registerInterest(id)
        setInterested(true)
      }
    } catch {
      // ignore
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    )
  }

  if (!hackathon) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/hackathons" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            All Hackathons
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{hackathon.title}</h1>
              {hackathon.theme && <Badge variant="secondary">{hackathon.theme}</Badge>}
            </div>
            <Button
              variant={interested ? "default" : "outline"}
              onClick={toggleInterest}
              disabled={toggling}
              className="shrink-0"
            >
              {interested
                ? <><StarOff className="w-4 h-4 mr-2" />Remove Interest</>
                : <><Star className="w-4 h-4 mr-2" />I'm Interested</>
              }
            </Button>
          </div>

          {/* Details card */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4">
            <p className="text-muted-foreground">{hackathon.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>
                  {new Date(hackathon.start_date).toLocaleDateString()} –{" "}
                  {new Date(hackathon.end_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{hackathon.location || "Online"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>Max team size: {hackathon.max_team_size}</span>
              </div>
              {hackathon.registration_url && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-primary" />
                  <a
                    href={hackathon.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Official Registration
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => router.push(`/hackathons/${id}/teams`)}>
              <Trophy className="w-4 h-4 mr-2" />
              Browse Teams
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => router.push(`/search?hackathonId=${id}`)}>
              <Users className="w-4 h-4 mr-2" />
              Find Teammates
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
