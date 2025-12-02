"use client"

import { useState } from "react"
import { signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Terminal } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<"admin" | "client">("admin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        // Wait for JWT token to be properly set in cookies
        let sessionAttempts = 0
        let session = null
        
        while (sessionAttempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 300))
          
          const sessionRes = await fetch("/api/auth/session")
          session = await sessionRes.json()
          
          if (session?.user?.id) {
            break
          }
          
          sessionAttempts++
        }
        
        if (!session?.user?.id) {
          setError("Session could not be established. Please try again.")
          setLoading(false)
          return
        }

        const userRole = session.user.role || "client"
        const redirectUrl = userRole === "client" ? "/projects" : "/"
        
        // Redirect to appropriate dashboard
        window.location.href = redirectUrl
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="mb-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Terminal className="h-10 w-10 text-primary" />
            <h1 className="text-4xl tracking-tight text-foreground">
              DevControl
            </h1>
          </div>
          <p className="text-muted-foreground">
            {role === 'admin' ? 'System Administration' : 'Client Portal'}
          </p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1 pb-6">
            <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setRole("admin")}
                className={`py-2 text-sm rounded-md transition-all duration-200 ${role === "admin"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Admin
              </button>
              <button
                onClick={() => setRole("client")}
                className={`py-2 text-sm rounded-md transition-all duration-200 ${role === "client"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Client
              </button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center animate-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Protected System • Authorized Access Only</p>
        </div>
      </div>
    </div>
  )
}
