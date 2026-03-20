"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { WelcomeSection } from "@/components/dashboard/WelcomeSection"
import { QuickActions } from "@/components/dashboard/QuickActions"
import { HackathonsWidget } from "@/components/dashboard/HackathonsWidget"
import { MyTeamsWidget } from "@/components/dashboard/MyTeamsWidget"
import { PendingItemsWidget } from "@/components/dashboard/PendingItemsWidget"

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-md space-y-4 px-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8 flex flex-col gap-8">
        <WelcomeSection displayName={user?.display_name} />
        <QuickActions />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <HackathonsWidget />
          <MyTeamsWidget />
        </div>
        <PendingItemsWidget />
      </main>
    </div>
  )
}
