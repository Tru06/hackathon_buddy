import { Suspense } from "react"
import SearchPageInner from "./SearchPageInner"

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  )
}
