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
  Terminal,
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
  { name: "Deployments", href: "/deployments", icon: Zap },
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

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navigation = session?.user?.role === "admin" ? adminNavigation : clientNavigation

  return (
    <div
      className={cn(
        "relative flex h-screen flex-col border-r bg-card transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[70px]" : "w-64"
      )}
    >
      <div className={cn(
        "flex h-16 items-center border-b px-4 transition-all",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Terminal className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold font-mono tracking-tight whitespace-nowrap overflow-hidden">
              DevControl
            </h1>
          </div>
        )}
        {isCollapsed && (
          <Terminal className="h-6 w-6 text-primary" />
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", isCollapsed && "h-8 w-8")}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-x-hidden">
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
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3 space-y-2 overflow-hidden">
        <div className={cn(
          "flex items-center transition-all",
          isCollapsed ? "justify-center flex-col gap-2" : "justify-between"
        )}>
          {!isCollapsed && <span className="text-xs text-muted-foreground whitespace-nowrap">Theme</span>}
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          className={cn(
            "w-full transition-all",
            isCollapsed ? "justify-center px-2" : "justify-start"
          )}
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
          {!isCollapsed && <span className="whitespace-nowrap">Sign Out</span>}
        </Button>
      </div>
    </div>
  )
}

