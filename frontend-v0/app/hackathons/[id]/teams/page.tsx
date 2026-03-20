"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { getTeams, createTeam, getHackathonById, type Team, type Hackathon } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Users, Plus, Lock, Unlock, Trophy } from "lucide-react"

export default function TeamsPage() {
  const { id: hackathonId } = useParams<{ id: string }>()
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()

  const [hackathon, setHackathon] = useState<Hackathon | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    max_members: 4,
    required_skills: "",
    is_open: true,
  })

  useEffect(() => {
    Promise.all([
      getHackathonById(hackathonId).catch(() => null),
      getTeams(hackathonId).catch(() => []),
    ]).then(([h, t]) => {
      setHackathon(h)
      setTeams(t)
    }).finally(() => setLoading(false))
  }, [hackathonId])

  async function handleCreate() {
    if (!isAuthenticated) { router.push("/login"); return }
    if (!form.name.trim()) return
    setCreating(true)
    try {
      const skills = form.required_skills
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
      const team = await createTeam({
        name: form.name,
        description: form.description,
        hackathon_id: hackathonId,
        max_members: form.max_members,
        required_skills: skills,
        is_open: form.is_open,
      })
      setTeams(prev => [team, ...prev])
      setShowCreate(false)
      setForm({ name: "", description: "", max_members: 4, required_skills: "", is_open: true })
    } catch {
      // ignore
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link href={`/hackathons/${hackathonId}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            {hackathon?.title ?? "Hackathon"}
          </Link>
          <h1 className="text-xl font-bold">Teams</h1>
          <Button size="sm" className="ml-auto" onClick={() => {
            if (!isAuthenticated) { router.push("/login"); return }
            setShowCreate(true)
          }}>
            <Plus className="w-4 h-4 mr-1" />
            Create Team
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="bg-card rounded-2xl border border-border/50 p-6 space-y-3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No open teams yet.</p>
            <Button onClick={() => {
              if (!isAuthenticated) { router.push("/login"); return }
              setShowCreate(true)
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create the first team
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team, i) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border/50 rounded-2xl p-6 flex flex-col gap-3 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-bold text-lg leading-tight">{team.name}</h2>
                  <span className="text-muted-foreground shrink-0">
                    {team.is_open
                      ? <Unlock className="w-4 h-4 text-green-500" />
                      : <Lock className="w-4 h-4" />
                    }
                  </span>
                </div>

                {team.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{team.description}</p>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{(team as any).member_count ?? 0} / {team.max_members} members</span>
                </div>

                {team.required_skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {team.required_skills.slice(0, 4).map(s => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                    {team.required_skills.length > 4 && (
                      <Badge variant="outline" className="text-xs">+{team.required_skills.length - 4}</Badge>
                    )}
                  </div>
                )}

                {/* Member avatars */}
                {team.members?.length > 0 && (
                  <div className="flex -space-x-2">
                    {team.members.slice(0, 5).map(m => (
                      <Avatar key={m.user_id} className="w-7 h-7 border-2 border-background">
                        <AvatarImage src={m.avatar_url} />
                        <AvatarFallback className="text-xs">{(m.display_name ?? "?")[0]}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                )}

                <Button
                  variant="outline"
                  className="mt-auto w-full"
                  onClick={() => router.push(`/search?hackathonId=${hackathonId}`)}
                >
                  Find Teammates
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Create Team Dialog */}
      <AnimatePresence>
        {showCreate && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create a Team</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Team name *</label>
                  <Input
                    placeholder="e.g. Code Wizards"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="What are you building?"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Required skills (comma-separated)</label>
                  <Input
                    placeholder="e.g. React, Python, UI/UX"
                    value={form.required_skills}
                    onChange={e => setForm(f => ({ ...f, required_skills: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="space-y-1 flex-1">
                    <label className="text-sm font-medium">Max members</label>
                    <Input
                      type="number"
                      min={2}
                      max={10}
                      value={form.max_members}
                      onChange={e => setForm(f => ({ ...f, max_members: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Open to join</label>
                    <div className="flex items-center gap-2 h-10">
                      <button
                        onClick={() => setForm(f => ({ ...f, is_open: !f.is_open }))}
                        className={`w-10 h-6 rounded-full transition-colors ${form.is_open ? "bg-primary" : "bg-muted"}`}
                      >
                        <span className={`block w-4 h-4 rounded-full bg-white mx-1 transition-transform ${form.is_open ? "translate-x-4" : ""}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={creating || !form.name.trim()}>
                  {creating ? "Creating…" : "Create Team"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  )
}
