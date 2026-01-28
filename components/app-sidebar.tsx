"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Trophy,
  Coins,
  Gift,
  FileText,
} from "lucide-react"

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/leaderboards", label: "Leaderboards", icon: Trophy },
  { href: "/distributions", label: "Distributions", icon: Coins },
  { href: "/claims", label: "Claims", icon: Gift },
  { href: "/docs", label: "Docs", icon: FileText },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-16 z-40 hidden h-[calc(100vh-4rem)] w-56 border-r border-border bg-card/30 backdrop-blur-sm lg:block">
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground glow-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="absolute bottom-4 left-4 text-xs">
        <div className="text-muted-foreground">Current Epoch</div>
        <div className="text-primary font-mono">#42</div>
      </div>
    </aside>
  )
}
