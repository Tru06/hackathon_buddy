"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { findMatchingUsers, sendConnectionRequest, type User } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Search, UserPlus, Check, Github, Linkedin, Globe } from "lucide-react"

const SKILL_SUGGESTIONS = [
  "React", "TypeScript", "Python", "Node.js", "Machine Learning",
  "UI/UX", "Figma", "Go", "Rust", "Flutter", "AWS", "Docker",
]

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>}>
      <SearchPageInner />
    </Suspense>
  )
}

function SearchPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const hackathonId = searchParams.get("hackathonId") ?? undefined

  const [skillInput, setSkillInput] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [availability, setAvailability] = useState("")
  const [results, setResults] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState<Record<string, boolean>>({})

  const doSearch = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const data = await findMatchingUsers({
        skills: skills.join(","),
        availability: availability || undefined,
        hackathonId,
        page: p,
        pageSize: 12,
      })
      if (p === 1) setResults(data.items as unknown as User[])
      else setResults(prev => [...prev, ...data.items as unknown as User[]])
      setTotal(data.total)
      setPage(p)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [skills, availability, hackathonId])

  useEffect(() => { doSearch(1) }, [doSearch])

  function addSkill(s: string) {
    const trimmed = s.trim()
    if (trimmed && !skills.includes(trimmed)) setSkills(prev => [...prev, trimmed])
    setSkillInput("")
  }

  function removeSkill(s: string) {
    setSkills(prev => prev.filter(x => x !== s))
  }

  async function connect(userId: string) {
    if (!isAuthenticated) { router.push("/login"); return }
    try {
      await sendConnectionRequest(userId)
      setConnected(prev => ({ ...prev, [userId]: true }))
    } catch {
      // already sent or error
      setConnected(prev => ({ ...prev, [userId]: true }))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link href={hackathonId ? `/hackathons/${hackathonId}` : "/"} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-xl font-bold">Find Teammates</h1>
          {hackathonId && <Badge variant="outline" className="text-xs">Filtered by hackathon</Badge>}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 mb-8 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Add a skill filter (e.g. React)…"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addSkill(skillInput) }}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => addSkill(skillInput)} disabled={!skillInput.trim()}>
              Add
            </Button>
          </div>

          {/* Quick skill chips */}
          <div className="flex flex-wrap gap-2">
            {SKILL_SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => addSkill(s)}
                disabled={skills.includes(s)}
                className="text-xs px-3 py-1 rounded-full border border-border/50 hover:border-primary/50 hover:text-primary disabled:opacity-40 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Active skill filters */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map(s => (
                <Badge key={s} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeSkill(s)}>
                  {s} ×
                </Badge>
              ))}
              <button onClick={() => setSkills([])} className="text-xs text-muted-foreground hover:text-foreground">
                Clear all
              </button>
            </div>
          )}

          {/* Availability filter */}
          <div className="flex gap-2 flex-wrap">
            {["", "FULL_TIME", "PART_TIME", "WEEKENDS"].map(a => (
              <button
                key={a}
                onClick={() => setAvailability(a)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  availability === a
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 hover:border-primary/50"
                }`}
              >
                {a === "" ? "Any availability" : a.replace("_", " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <p className="text-sm text-muted-foreground mb-4">
          {loading && results.length === 0 ? "Searching…" : `${total} teammate${total !== 1 ? "s" : ""} found`}
        </p>

        {loading && results.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-card rounded-2xl border border-border/50 p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No teammates found. Try adjusting your filters.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((u: any, i) => (
                <motion.div
                  key={u.user_id ?? u.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card border border-border/50 rounded-2xl p-6 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={u.avatar_url} />
                      <AvatarFallback>{(u.display_name ?? u.email ?? "?")[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{u.display_name || "Anonymous"}</p>
                      {u.availability && (
                        <p className="text-xs text-muted-foreground">
                          {u.availability.replace("_", " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </p>
                      )}
                    </div>
                    {u.score !== undefined && (
                      <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {Math.round(u.score * 100)}%
                      </span>
                    )}
                  </div>

                  {u.bio && <p className="text-sm text-muted-foreground line-clamp-2">{u.bio}</p>}

                  {u.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {u.skills.slice(0, 5).map((s: string) => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                      {u.skills.length > 5 && (
                        <Badge variant="outline" className="text-xs">+{u.skills.length - 5}</Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-auto">
                    {u.github_url && (
                      <a href={u.github_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {u.linkedin_url && (
                      <a href={u.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {u.portfolio_url && (
                      <a href={u.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                    <Button
                      size="sm"
                      variant={connected[u.user_id ?? u.id] ? "secondary" : "default"}
                      className="ml-auto"
                      onClick={() => connect(u.user_id ?? u.id)}
                      disabled={!!connected[u.user_id ?? u.id]}
                    >
                      {connected[u.user_id ?? u.id]
                        ? <><Check className="w-3 h-3 mr-1" />Sent</>
                        : <><UserPlus className="w-3 h-3 mr-1" />Connect</>
                      }
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {results.length < total && (
              <div className="text-center mt-8">
                <Button variant="outline" onClick={() => doSearch(page + 1)} disabled={loading}>
                  {loading ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
