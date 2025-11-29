"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { CommandPaletteProvider } from "@/components/command-palette-provider"

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/signup")

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <CommandPaletteProvider>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </CommandPaletteProvider>
  )
}

