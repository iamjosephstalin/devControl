"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Zap, Globe, AlertCircle } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

export default function VercelPage() {
  const [token, setToken] = useState("")
  const [hasToken, setHasToken] = useState(false)

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["vercel-projects", token],
    queryFn: async () => {
      if (!token) return []
      const res = await fetch("https://api.vercel.com/v9/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) throw new Error("Failed to fetch projects")
      const data = await res.json()
      return data.projects || []
    },
    enabled: hasToken && !!token,
  })

  const handleConnect = () => {
    if (token) {
      setHasToken(true)
    }
  }

  if (!hasToken) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-mono tracking-tight">Vercel Integration</h1>
          <p className="text-muted-foreground">
            Connect your Vercel account to view deployments and projects
          </p>
        </div>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Connect Vercel</CardTitle>
            <CardDescription>
              Enter your Vercel API Token to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="token">Vercel API Token</Label>
              <Input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="vercel_xxxxxxxxxxxx"
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Create a token at{" "}
                <a
                  href="https://vercel.com/account/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  vercel.com/account/tokens
                </a>
              </p>
            </div>
            <Button onClick={handleConnect} disabled={!token}>
              Connect
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return <div className="p-8">Loading projects...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight">Vercel</h1>
          <p className="text-muted-foreground">
            Your Vercel deployments and projects
          </p>
        </div>
        <Button variant="outline" onClick={() => setHasToken(false)}>
          Disconnect
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No projects found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      {project.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {project.framework || "No framework"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground">
                    Created {formatDate(new Date(project.createdAt))}
                  </div>
                  {project.latestDeployment && (
                    <div>
                      <Badge
                        variant={
                          project.latestDeployment.state === "READY"
                            ? "default"
                            : "outline"
                        }
                      >
                        {project.latestDeployment.state}
                      </Badge>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <a
                      href={`https://vercel.com/${project.accountId}/${project.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on Vercel <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

