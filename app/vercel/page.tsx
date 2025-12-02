"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Zap, Settings } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useState } from "react"
import { fetchVercelProjects } from "@/lib/vercel"
import { fetchIntegrations, getIntegrationToken } from "@/lib/integrations"
import { IntegrationCard } from "@/components/integrations/integration-card"
import { CreateIntegrationDialog } from "@/components/integrations/create-integration-dialog"

export default function VercelPage() {
  const [activeTab, setActiveTab] = useState("projects")

  // Fetch all integrations
  const { data: integrations = [], isLoading: integrationsLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: fetchIntegrations
  })

  // Filter Vercel integrations
  const vercelIntegrations = integrations.filter(i => i.type === 'vercel' && i.status === 'connected')

  // Fetch projects from all connected Vercel integrations
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["vercel-projects", vercelIntegrations.map(i => i.id)],
    queryFn: async () => {
      const allProjects = []
      for (const integration of vercelIntegrations) {
        try {
          const token = await getIntegrationToken(integration.id)
          const teamId = integration.config?.teamId
          const projects = await fetchVercelProjects(token, teamId)
          allProjects.push(...projects.map(project => ({ ...project, integration: integration.name })))
        } catch (error) {
          console.error(`Failed to fetch projects from ${integration.name}:`, error)
        }
      }
      return allProjects
    },
    enabled: vercelIntegrations.length > 0,
  })

  const isLoading = projectsLoading || integrationsLoading

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold font-mono tracking-tight truncate">Vercel</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Your Vercel deployments and projects
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <CreateIntegrationDialog />
            <Button 
              variant="outline" 
              onClick={() => setActiveTab(activeTab === "projects" ? "integrations" : "projects")}
              className="whitespace-nowrap"
            >
              <Settings className="mr-2 h-4 w-4" />
              {activeTab === "projects" ? "Manage Integrations" : "View Projects"}
            </Button>
          </div>
        </div>
      </div>

      {activeTab === "integrations" ? (
        <div className="space-y-6">
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-semibold mb-2">Connected Vercel Accounts</h2>
            <p className="text-sm text-muted-foreground">
              Manage your Vercel integrations and API tokens
            </p>
          </div>
          
          {integrationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <div className="text-muted-foreground text-sm">Loading integrations...</div>
              </div>
            </div>
          ) : vercelIntegrations.length === 0 ? (
            <Card className="w-full">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-center space-y-4 max-w-md">
                  <div className="text-muted-foreground">
                    No Vercel integrations found. Connect your Vercel account to view your projects and deployments.
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ll need a Vercel API token to get started.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {vercelIntegrations.map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Projects</h2>
              <p className="text-sm text-muted-foreground">
                {projects.length > 0 ? `${projects.length} project${projects.length === 1 ? '' : 's'} found` : 'Your Vercel projects will appear here'}
              </p>
            </div>
            {vercelIntegrations.length > 0 && (
              <div className="text-sm text-muted-foreground">
                From {vercelIntegrations.length} connected account{vercelIntegrations.length === 1 ? '' : 's'}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <div className="text-muted-foreground text-sm">Loading projects...</div>
              </div>
            </div>
          ) : projects.length === 0 ? (
            <Card className="w-full">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-center space-y-4 max-w-md">
                  <div className="text-muted-foreground">
                    {vercelIntegrations.length === 0 
                      ? "No Vercel integrations found. Connect your Vercel account to get started."
                      : "No projects found in your connected Vercel accounts."
                    }
                  </div>
                  {vercelIntegrations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Switch to the Integrations tab to add your Vercel account.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Projects from your connected accounts will appear here automatically.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project: any) => (
                <Card key={project.id} className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg flex items-center gap-2 truncate">
                          <Zap className="h-5 w-5 flex-shrink-0" />
                          <span className="truncate">{project.name}</span>
                        </CardTitle>
                        <CardDescription className="mt-1 truncate">
                          {project.framework || "No framework"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <div className="text-xs text-muted-foreground">
                          Created {formatDate(new Date(project.createdAt))}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          via {project.integration}
                        </div>
                      </div>
                      
                      {project.latestDeployment && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Status:</span>
                          <Badge
                            variant={
                              project.latestDeployment.state === "READY"
                                ? "default"
                                : project.latestDeployment.state === "BUILDING"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs"
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
                          View on Vercel <ExternalLink className="ml-2 h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

