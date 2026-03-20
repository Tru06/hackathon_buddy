"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  getPendingInvites,
  getPendingConnections,
  respondToInvite,
  respondToConnectionRequest,
  type PendingInvite,
  type PendingConnectionRequest,
} from "@/lib/api"
import { Bell } from "lucide-react"

export function PendingItemsWidget() {
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [connections, setConnections] = useState<PendingConnectionRequest[]>([])
  const [ready, setReady] = useState(false)

  const fetchData = useCallback(() => {
    Promise.allSettled([getPendingInvites(), getPendingConnections()]).then(
      ([invitesResult, connectionsResult]) => {
        const inv = invitesResult.status === "fulfilled" ? invitesResult.value : []
        const conn = connectionsResult.status === "fulfilled" ? connectionsResult.value : []
        setInvites(inv)
        setConnections(conn)
        setReady(true)
      }
    )
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (!ready) return null
  if (invites.length === 0 && connections.length === 0) return null

  const handleInvite = async (id: string, accept: boolean) => {
    try {
      await respondToInvite(id, accept)
    } catch {
      // silent fail for MVP — keep item in list on error
      return
    }
    setInvites((prev) => prev.filter((i) => i.id !== id))
  }

  const handleConnection = async (id: string, accept: boolean) => {
    try {
      await respondToConnectionRequest(id, accept)
    } catch {
      // silent fail for MVP — keep item in list on error
      return
    }
    setConnections((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-primary" />
        <h2 className="text-lg font-semibold">Pending</h2>
      </div>

      {invites.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Team Invites
          </p>
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="rounded-xl border border-border/50 p-4 flex items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-medium truncate">{invite.team_name}</span>
                <span className="text-sm text-muted-foreground truncate">
                  Invited by {invite.inviter_name}
                </span>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={() => handleInvite(invite.id, true)}>
                  Accept
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleInvite(invite.id, false)}>
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {connections.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Connection Requests
          </p>
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="rounded-xl border border-border/50 p-4 flex items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-medium truncate">
                  {conn.display_name ?? "Someone"}
                </span>
                {conn.message && (
                  <span className="text-sm text-muted-foreground truncate">
                    {conn.message.slice(0, 80)}
                  </span>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={() => handleConnection(conn.id, true)}>
                  Accept
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleConnection(conn.id, false)}>
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
