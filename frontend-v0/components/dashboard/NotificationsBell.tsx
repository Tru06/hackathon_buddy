"use client"

import { useEffect, useState, useCallback } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  getUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api"

interface Notification {
  id: string
  type: string
  payload: Record<string, unknown>
  read: boolean
  created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  CONNECTION_REQUEST: "New connection request",
  CONNECTION_ACCEPTED: "Connection accepted",
  TEAM_INVITE: "Team invite received",
  TEAM_INVITE_ACCEPTED: "Team invite accepted",
  TEAM_INVITE_DECLINED: "Team invite declined",
  TEAM_MESSAGE: "New team message",
}

export function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await getUnreadNotifications()
      setNotifications(data as Notification[])
    } catch {
      // silently ignore — bell is non-critical
    }
  }, [])

  // Poll every 30s
  useEffect(() => {
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [load])

  async function handleMarkRead(id: string) {
    await markNotificationRead(id).catch(() => {})
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  async function handleMarkAll() {
    await markAllNotificationsRead().catch(() => {})
    setNotifications([])
  }

  const count = notifications.length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <span className="font-semibold text-sm">Notifications</span>
          {count > 0 && (
            <button
              onClick={handleMarkAll}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {count === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              You&apos;re all caught up
            </p>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 border-b border-border/30 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{TYPE_LABELS[n.type] ?? n.type}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="text-xs text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
                >
                  Dismiss
                </button>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
