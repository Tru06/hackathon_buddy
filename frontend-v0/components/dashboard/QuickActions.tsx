import Link from "next/link"
import { Users, Trophy, Plus } from "lucide-react"

const actions = [
  {
    href: "/search",
    icon: Users,
    title: "Find Teammates",
    description: "Discover people with the skills you need",
  },
  {
    href: "/hackathons",
    icon: Trophy,
    title: "Browse Hackathons",
    description: "Find your next event",
  },
  {
    href: "/hackathons",
    icon: Plus,
    title: "Create Team",
    description: "Start building your dream team",
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {actions.map(({ href, icon: Icon, title, description }) => (
        <Link
          key={title}
          href={href}
          className="bg-card border border-border/50 hover:border-primary/50 rounded-2xl p-5 flex flex-col gap-2 transition-colors"
        >
          <Icon className="w-5 h-5 text-primary" />
          <span className="font-semibold">{title}</span>
          <span className="text-sm text-muted-foreground">{description}</span>
        </Link>
      ))}
    </div>
  )
}
