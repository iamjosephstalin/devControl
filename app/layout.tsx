import type { Metadata } from "next"
import "./globals.css"
import "./google-sans.css"
import { Providers } from "./providers"
import { AppLayoutClient } from "./layout-client"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "DevControl - Your Personal Developer Operating System",
  description: "Unified dashboard for projects, tasks, servers, deployments, and more",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ fontFamily: "'Google Sans Code', ui-monospace, SFMono-Regular, 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}>
        <Providers>
          <AppLayoutClient>{children}</AppLayoutClient>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}

