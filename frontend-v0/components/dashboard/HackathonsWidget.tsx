"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { getHackathons, type Hackathon } from "@/lib/api"
import { Calendar, Trophy } from "lucide-react"

type State =
  | { status: "loading" }
  | { status: "success"; data: Hackathon[] }
  | { status: "empty" }
  | { status: "error" }

export function HackathonsWidget() {
  const [state, setState] = useState<State>({ status: "loading" })

  const fetchData = useCallback(() => {
    setState({ status: "loading" })
    getHackathons()
      .then((data) => {
        if (data.length === 0) setState({ status: "empty" })
        else setState({ status: "success", data })
      })
      .catch(() => setState({ status: "error" }))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Upcoming Hackathons</h2>
        <Link href="/hackathons" className="text-sm text-primary hover:underline">
          View all →
        </Link>
      </div>

      {state.status === "loading" && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border/50 p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {state.status === "success" && (
        <div className="flex flex-col gap-3">
          {state.data.slice(0, 3).map((h) => (
            <div
              key={h.id}
              className="rounded-xl border border-border/50 hover:border-primary/50 transition-colors p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium leading-tight">{h.title}</span>
                {h.theme && (
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {h.theme}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {new Date(h.start_date).toLocaleDateString()} –{" "}
                  {new Date(h.end_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {state.status === "empty" && (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-muted-foreground">
          <Trophy className="w-8 h-8" />
          <p className="text-sm">No upcoming hackathons.</p>
        </div>
      )}

      {state.status === "error" && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <p className="text-sm text-muted-foreground">Failed to load hackathons.</p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            Retry
          </Button>
        </div>
      )}
    </div>
  )
}
