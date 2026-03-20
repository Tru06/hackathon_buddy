interface WelcomeSectionProps {
  displayName?: string | null
}

export function WelcomeSection({ displayName }: WelcomeSectionProps) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-3xl font-bold">
        {displayName ? `Welcome back, ${displayName}!` : "Welcome back!"}
      </h1>
      <p className="text-muted-foreground">Here&apos;s what&apos;s happening.</p>
    </div>
  )
}
