"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Key,
  Server,
  Github,
  Zap,
  FileText,
  Calendar,
  Settings,
  LogOut,
  User,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

const adminNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Secrets", href: "/secrets", icon: Key },
  { name: "Infrastructure", href: "/infrastructure", icon: Server },
  { name: "Version Control", href: "/version-control", icon: Github },
  { name: "Deployment Integrations", href: "/deployments", icon: Zap },
  { name: "Notes", href: "/notes", icon: FileText },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
]

const clientNavigation = [
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Profile", href: "/profile", icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const navigation = session?.user?.role === "admin" ? adminNavigation : clientNavigation

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold font-mono tracking-tight">DevControl</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-l-2 hover:border-l-primary"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

