"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { Dialog, DialogContent } from "@/components/ui/dialog"
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
  Plus,
  Search,
  Moon,
  Sun,
  User,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { useTheme } from "next-themes"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CommandItem {
  id: string
  label: string
  icon: React.ElementType
  href?: string
  action?: () => void
  keywords: string[]
  group: string
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const { setTheme, theme } = useTheme()
  const [search, setSearch] = React.useState("")

  const commands: CommandItem[] = [
    // Navigation
    {
      id: "dashboard",
      label: "Go to Dashboard",
      icon: LayoutDashboard,
      href: "/",
      keywords: ["dashboard", "home", "main"],
      group: "Navigation",
    },
    {
      id: "projects",
      label: "Go to Projects",
      icon: FolderKanban,
      href: "/projects",
      keywords: ["projects", "project", "repo"],
      group: "Navigation",
    },
    {
      id: "tasks",
      label: "Go to Tasks",
      icon: CheckSquare,
      href: "/tasks",
      keywords: ["tasks", "task", "kanban", "todo"],
      group: "Navigation",
    },
    {
      id: "secrets",
      label: "Go to Secrets",
      icon: Key,
      href: "/secrets",
      keywords: ["secrets", "secret", "keys", "credentials", "password"],
      group: "Navigation",
    },
    {
      id: "infrastructure",
      label: "Go to Infrastructure",
      icon: Server,
      href: "/infrastructure",
      keywords: ["infrastructure", "servers", "server", "ssh"],
      group: "Navigation",
    },
    {
      id: "git-providers",
      label: "Go to Git Providers",
      icon: Github,
      href: "/github",
      keywords: ["git", "github", "gitlab", "repositories", "repo"],
      group: "Navigation",
    },
    {
      id: "deployments",
      label: "Go to Deployment Integrations",
      icon: Zap,
      href: "/deployments",
      keywords: ["deployments", "deployment", "vercel", "netlify", "railway", "render"],
      group: "Navigation",
    },
    {
      id: "notes",
      label: "Go to Notes",
      icon: FileText,
      href: "/notes",
      keywords: ["notes", "note", "docs", "documentation"],
      group: "Navigation",
    },
    {
      id: "schedule",
      label: "Go to Schedule",
      icon: Calendar,
      href: "/schedule",
      keywords: ["schedule", "calendar", "plan"],
      group: "Navigation",
    },
    {
      id: "settings",
      label: "Go to Settings",
      icon: Settings,
      href: "/settings",
      keywords: ["settings", "preferences", "config"],
      group: "Navigation",
    },
    // Actions
    {
      id: "new-project",
      label: "Create New Project",
      icon: Plus,
      href: "/projects",
      keywords: ["new project", "create project", "add project"],
      group: "Actions",
    },
    {
      id: "new-task",
      label: "Create New Task",
      icon: Plus,
      href: "/tasks",
      keywords: ["new task", "create task", "add task"],
      group: "Actions",
    },
    {
      id: "new-secret",
      label: "Create New Secret",
      icon: Plus,
      href: "/secrets",
      keywords: ["new secret", "create secret", "add secret"],
      group: "Actions",
    },
    {
      id: "new-note",
      label: "Create New Note",
      icon: Plus,
      href: "/notes",
      keywords: ["new note", "create note", "add note"],
      group: "Actions",
    },
    // Theme
    {
      id: "toggle-theme",
      label: `Switch to ${theme === "dark" ? "Light" : "Dark"} Theme`,
      icon: theme === "dark" ? Sun : Moon,
      action: () => setTheme(theme === "dark" ? "light" : "dark"),
      keywords: ["theme", "dark", "light", "toggle theme"],
      group: "Appearance",
    },
    // Account
    {
      id: "sign-out",
      label: "Sign Out",
      icon: LogOut,
      action: () => signOut({ callbackUrl: "/login" }),
      keywords: ["sign out", "logout", "exit"],
      group: "Account",
    },
  ]

  const filteredCommands = React.useMemo(() => {
    if (!search) return commands

    const searchLower = search.toLowerCase()
    return commands.filter((cmd) => {
      return (
        cmd.label.toLowerCase().includes(searchLower) ||
        cmd.keywords.some((keyword) => keyword.toLowerCase().includes(searchLower))
      )
    })
  }, [search, commands])

  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.group]) {
        groups[cmd.group] = []
      }
      groups[cmd.group].push(cmd)
    })
    return groups
  }, [filteredCommands])

  const handleSelect = (command: CommandItem) => {
    if (command.action) {
      command.action()
    } else if (command.href) {
      router.push(command.href)
    }
    onOpenChange(false)
    setSearch("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Type a command or search..."
              value={search}
              onValueChange={setSearch}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty>No results found.</Command.Empty>
            {Object.entries(groupedCommands).map(([groupName, groupCommands]) => (
              <Command.Group key={groupName} heading={groupName}>
                {groupCommands.map((cmd) => {
                  const Icon = cmd.icon
                  return (
                    <Command.Item
                      key={cmd.id}
                      value={cmd.id}
                      onSelect={() => handleSelect(cmd)}
                      className="flex items-center gap-2 rounded-sm px-2 py-3 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                    >
                      <Icon className="h-4 w-4" />
                      {cmd.label}
                    </Command.Item>
                  )
                })}
              </Command.Group>
            ))}
          </Command.List>
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Navigate with ↑↓</span>
              <span>Select with Enter</span>
              <span>Close with Esc</span>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

