"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { getMyTeams, type MyTeam } from "@/lib/api"
import { Users } from "lucide-react"

type State =
  | { status: "loading" }
  | { status: "success"; data: MyTeam[] }
  | { status: "empty" }
  | { status: "error" }

export function MyTeamsWidget() {
  const [state, setState] = useState<State>({ status: "loading" })

  const fetchData = useCallback(() => {
    setState({ status: "loading" })
    getMyTeams()
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
        <h2 className="text-lg font-semibold">My Teams</h2>
      </div>

      {state.status === "loading" && (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border/50 p-4 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </div>
      )}

      {state.status === "success" && (
        <div className="flex flex-col gap-3">
          {state.data.map((team) => (
            <Link
              key={team.id}
              href={`/hackathons/${team.hackathon_id}/teams/${team.id}`}
              className="rounded-xl border border-border/50 hover:border-primary/50 transition-colors p-4 flex flex-col gap-1"
            >
              <span className="font-medium">{team.name}</span>
              <span className="text-sm text-muted-foreground">{team.hackathon_name}</span>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <Users className="w-3.5 h-3.5" />
                <span>{team.member_count} member{team.member_count !== 1 ? "s" : ""}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {state.status === "empty" && (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
          <p className="text-sm text-muted-foreground">You&apos;re not on any teams yet.</p>
          <div className="flex gap-2 text-sm">
            <Link href="/search" className="text-primary hover:underline">Find teammates</Link>
            <span className="text-muted-foreground">or</span>
            <Link href="/hackathons" className="text-primary hover:underline">browse hackathons</Link>
          </div>
        </div>
      )}

      {state.status === "error" && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <p className="text-sm text-muted-foreground">Failed to load teams.</p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            Retry
          </Button>
        </div>
      )}
    </div>
  )
}
