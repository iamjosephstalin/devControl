"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ExternalLink,
  Zap,
  Globe,
  Rocket,
  Server,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { fetchVercelProjects } from "@/lib/vercel"
import { fetchNetlifySites } from "@/lib/netlify"
import { fetchRailwayProjects } from "@/lib/railway"
import { fetchRenderServices } from "@/lib/render"

type Provider = "vercel" | "netlify" | "railway" | "render"

export default function DeploymentsPage() {
  const [activeProvider, setActiveProvider] = useState<Provider>("vercel")
  const [tokens, setTokens] = useState<Record<Provider, string>>({
    vercel: "",
    netlify: "",
    railway: "",
    render: "",
  })
  const [connectedProviders, setConnectedProviders] = useState<Set<Provider>>(new Set())

  const handleTokenChange = (provider: Provider, value: string) => {
    setTokens((prev) => ({ ...prev, [provider]: value }))
  }

  const handleConnect = (provider: Provider) => {
    if (tokens[provider]) {
      setConnectedProviders((prev) => new Set(prev).add(provider))
    }
  }

  const handleDisconnect = (provider: Provider) => {
    setConnectedProviders((prev) => {
      const next = new Set(prev)
      next.delete(provider)
      return next
    })
    setTokens((prev) => ({ ...prev, [provider]: "" }))
  }

  // Vercel Query
  const { data: vercelProjects = [], isLoading: vercelLoading } = useQuery({
    queryKey: ["vercel-projects", tokens.vercel],
    queryFn: () => fetchVercelProjects(tokens.vercel),
    enabled: connectedProviders.has("vercel") && !!tokens.vercel,
  })

  // Netlify Query
  const { data: netlifySites = [], isLoading: netlifyLoading } = useQuery({
    queryKey: ["netlify-sites", tokens.netlify],
    queryFn: () => fetchNetlifySites(tokens.netlify),
    enabled: connectedProviders.has("netlify") && !!tokens.netlify,
  })

  // Railway Query
  const { data: railwayProjects = [], isLoading: railwayLoading } = useQuery({
    queryKey: ["railway-projects", tokens.railway],
    queryFn: () => fetchRailwayProjects(tokens.railway),
    enabled: connectedProviders.has("railway") && !!tokens.railway,
  })

  // Render Query
  const { data: renderServices = [], isLoading: renderLoading } = useQuery({
    queryKey: ["render-services", tokens.render],
    queryFn: () => fetchRenderServices(tokens.render),
    enabled: connectedProviders.has("render") && !!tokens.render,
  })

  const providerConfig = {
    vercel: {
      name: "Vercel",
      icon: Zap,
      color: "text-black dark:text-white",
      tokenUrl: "https://vercel.com/account/tokens",
      tokenPlaceholder: "vercel_xxxxxxxxxxxx",
      description: "Connect your Vercel account to view deployments and projects",
    },
    netlify: {
      name: "Netlify",
      icon: Globe,
      color: "text-[#00C7B7]",
      tokenUrl: "https://app.netlify.com/user/applications#personal-access-tokens",
      tokenPlaceholder: "nfp_xxxxxxxxxxxx",
      description: "Connect your Netlify account to view sites and deployments",
    },
    railway: {
      name: "Railway",
      icon: Rocket,
      color: "text-[#0A0D0D] dark:text-white",
      tokenUrl: "https://railway.app/account/tokens",
      tokenPlaceholder: "railway_xxxxxxxxxxxx",
      description: "Connect your Railway account to view projects and services",
    },
    render: {
      name: "Render",
      icon: Server,
      color: "text-[#46E3B7]",
      tokenUrl: "https://dashboard.render.com/account/api-keys",
      tokenPlaceholder: "rnd_xxxxxxxxxxxx",
      description: "Connect your Render account to view services and deployments",
    },
  }

  const renderConnectCard = (provider: Provider) => {
    const config = providerConfig[provider]
    const Icon = config.icon
    const isConnected = connectedProviders.has(provider)

    if (!isConnected) {
      return (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${config.color}`} />
              Connect {config.name}
            </CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor={`${provider}-token`}>{config.name} API Token</Label>
              <Input
                id={`${provider}-token`}
                type="password"
                value={tokens[provider]}
                onChange={(e) => handleTokenChange(provider, e.target.value)}
                placeholder={config.tokenPlaceholder}
                className="mt-2 font-mono"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Create a token at{" "}
                <a
                  href={config.tokenUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {config.tokenUrl.replace("https://", "")}
                </a>
              </p>
            </div>
            <Button onClick={() => handleConnect(provider)} disabled={!tokens[provider]}>
              Connect
            </Button>
          </CardContent>
        </Card>
      )
    }

    return null
  }

  const renderProjects = (provider: Provider) => {
    const config = providerConfig[provider]
    const Icon = config.icon

    if (provider === "vercel") {
      const isLoading = vercelLoading
      const projects = vercelProjects

      if (isLoading) {
        return (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )
      }

      if (projects.length === 0) {
        return (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No projects found</p>
            </CardContent>
          </Card>
        )
      }

      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${config.color}`} />
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
                  <div className="text-xs text-muted-foreground font-mono">
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
                  <Button variant="outline" size="sm" className="w-full" asChild>
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
      )
    }

    if (provider === "netlify") {
      const isLoading = netlifyLoading
      const sites = netlifySites

      if (isLoading) {
        return (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )
      }

      if (sites.length === 0) {
        return (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No sites found</p>
            </CardContent>
          </Card>
        )
      }

      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sites.map((site: any) => (
            <Card key={site.id}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${config.color}`} />
                  {site.name}
                </CardTitle>
                <CardDescription className="mt-1">
                  {site.build_settings?.branch || "No branch"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground font-mono">
                    Updated {formatDate(new Date(site.updated_at))}
                  </div>
                  <Badge variant={site.state === "ready" ? "default" : "outline"}>
                    {site.state}
                  </Badge>
                  {site.url && (
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href={site.url} target="_blank" rel="noopener noreferrer">
                        Visit Site <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (provider === "railway") {
      const isLoading = railwayLoading
      const projects = railwayProjects

      if (isLoading) {
        return (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )
      }

      if (projects.length === 0) {
        return (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No projects found</p>
            </CardContent>
          </Card>
        )
      }

      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${config.color}`} />
                  {project.name}
                </CardTitle>
                <CardDescription className="mt-1">
                  {project.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground font-mono">
                    Created {formatDate(new Date(project.createdAt))}
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a
                      href={`https://railway.app/project/${project.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on Railway <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (provider === "render") {
      const isLoading = renderLoading
      const services = renderServices

      if (isLoading) {
        return (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )
      }

      if (services.length === 0) {
        return (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No services found</p>
            </CardContent>
          </Card>
        )
      }

      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service: any) => (
            <Card key={service.id}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${config.color}`} />
                  {service.name}
                </CardTitle>
                <CardDescription className="mt-1">
                  {service.type.replace("_", " ")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground font-mono">
                    Updated {formatDate(new Date(service.updatedAt))}
                  </div>
                  <Badge variant={service.suspended ? "outline" : "default"}>
                    {service.suspended ? "Suspended" : "Active"}
                  </Badge>
                  {service.serviceDetails?.url && (
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a
                        href={service.serviceDetails.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visit Service <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    return null
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-mono tracking-tight">
          Deployment Integrations
        </h1>
        <p className="text-muted-foreground">
          Connect and manage your deployments across multiple platforms
        </p>
      </div>

      <Tabs value={activeProvider} onValueChange={(v) => setActiveProvider(v as Provider)}>
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          {Object.entries(providerConfig).map(([key, config]) => {
            const Icon = config.icon
            const isConnected = connectedProviders.has(key as Provider)
            return (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${config.color}`} />
                {config.name}
                {isConnected && (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {Object.keys(providerConfig).map((provider) => {
          const config = providerConfig[provider as Provider]
          const isConnected = connectedProviders.has(provider as Provider)

          return (
            <TabsContent key={provider} value={provider} className="mt-6">
              {!isConnected ? (
                renderConnectCard(provider as Provider)
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold font-mono">
                        {config.name} Projects
                      </h2>
                      <p className="text-muted-foreground">
                        {config.description}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleDisconnect(provider as Provider)}
                    >
                      Disconnect
                    </Button>
                  </div>
                  {renderProjects(provider as Provider)}
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}

