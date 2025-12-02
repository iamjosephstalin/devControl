"use client"

import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { CommandPaletteProvider } from "@/components/command-palette-provider"

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/signup")

  useEffect(() => {
    // If not on auth page and session is unauthenticated, redirect to login
    if (!isAuthPage && status === "unauthenticated") {
      const loginUrl = `/login${pathname !== "/" ? `?callbackUrl=${encodeURIComponent(pathname)}` : ""}`
      router.push(loginUrl)
    }
  }, [status, isAuthPage, pathname, router])

  if (isAuthPage) {
    return <>{children}</>
  }

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Don't render protected content if not authenticated
  if (status === "unauthenticated") {
    return null
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

