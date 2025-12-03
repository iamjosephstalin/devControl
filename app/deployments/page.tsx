"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Settings,
  Plus,
  Search
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { fetchIntegrations, getIntegrationToken } from "@/lib/integrations"
import { IntegrationCard } from "@/components/integrations/integration-card"
import { CreateDeploymentDialog } from "@/components/integrations/create-deployment-dialog"
import { DeploymentDetailsModal } from "@/components/deployments/deployment-details-modal"
import { fetchVercelProjects } from "@/lib/vercel"
import { fetchNetlifySites } from "@/lib/netlify"
import { fetchRailwayProjects } from "@/lib/railway"
import { fetchRenderServices } from "@/lib/render"

export default function DeploymentsPage() {
  const [activeTab, setActiveTab] = useState<'deployments' | 'integrations'>('deployments')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch all integrations
  const { data: integrations = [], isLoading: integrationsLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: fetchIntegrations
  })

  // Filter deployment integrations
  const deploymentIntegrationTypes = ['vercel', 'netlify', 'railway', 'render', 'aws', 'heroku', 'azure', 'gcp']
  const deploymentIntegrations = integrations.filter(i => 
    deploymentIntegrationTypes.includes(i.type) && i.status === 'connected'
  )

  // Filter by specific deployment services
  const vercelIntegrations = integrations.filter(i => i.type === 'vercel' && i.status === 'connected')
  const netlifyIntegrations = integrations.filter(i => i.type === 'netlify' && i.status === 'connected')
  const railwayIntegrations = integrations.filter(i => i.type === 'railway' && i.status === 'connected')
  const renderIntegrations = integrations.filter(i => i.type === 'render' && i.status === 'connected')

  // Fetch deployments from Vercel integrations
  const { data: vercelProjects = [], isLoading: vercelLoading } = useQuery({
    queryKey: ["vercel-projects", vercelIntegrations.map(i => i.id)],
    queryFn: async () => {
      const allProjects = []
      for (const integration of vercelIntegrations) {
        try {
          const token = await getIntegrationToken(integration.id)
          const teamId = integration.config?.teamId
          const projects = await fetchVercelProjects(token, teamId)
          allProjects.push(...projects.map(project => ({ 
            ...project, 
            integration: integration.name,
            provider: 'vercel',
            type: 'project'
          })))
        } catch (error) {
          console.error(`Failed to fetch projects from ${integration.name}:`, error)
        }
      }
      return allProjects
    },
    enabled: vercelIntegrations.length > 0,
  })

  // Fetch deployments from Netlify integrations
  const { data: netlifyProjects = [], isLoading: netlifyLoading } = useQuery({
    queryKey: ["netlify-sites", netlifyIntegrations.map(i => i.id)],
    queryFn: async () => {
      const allSites = []
      for (const integration of netlifyIntegrations) {
        try {
          const token = await getIntegrationToken(integration.id)
          const sites = await fetchNetlifySites(token)
          allSites.push(...sites.map(site => ({ 
            ...site, 
            integration: integration.name,
            provider: 'netlify',
            type: 'site'
          })))
        } catch (error) {
          console.error(`Failed to fetch sites from ${integration.name}:`, error)
        }
      }
      return allSites
    },
    enabled: netlifyIntegrations.length > 0,
  })

  // Fetch deployments from Railway integrations
  const { data: railwayProjects = [], isLoading: railwayLoading } = useQuery({
    queryKey: ["railway-projects", railwayIntegrations.map(i => i.id)],
    queryFn: async () => {
      const allProjects = []
      for (const integration of railwayIntegrations) {
        try {
          const token = await getIntegrationToken(integration.id)
          const projects = await fetchRailwayProjects(token)
          allProjects.push(...projects.map(project => ({ 
            ...project, 
            integration: integration.name,
            provider: 'railway',
            type: 'project'
          })))
        } catch (error) {
          console.error(`Failed to fetch projects from ${integration.name}:`, error)
        }
      }
      return allProjects
    },
    enabled: railwayIntegrations.length > 0,
  })

  // Fetch deployments from Render integrations
  const { data: renderServices = [], isLoading: renderLoading } = useQuery({
    queryKey: ["render-services", renderIntegrations.map(i => i.id)],
    queryFn: async () => {
      const allServices = []
      for (const integration of renderIntegrations) {
        try {
          const token = await getIntegrationToken(integration.id)
          const services = await fetchRenderServices(token)
          allServices.push(...services.map(service => ({ 
            ...service, 
            integration: integration.name,
            provider: 'render',
            type: 'service'
          })))
        } catch (error) {
          console.error(`Failed to fetch services from ${integration.name}:`, error)
        }
      }
      return allServices
    },
    enabled: renderIntegrations.length > 0,
  })

  // Combine all deployments
  const allDeployments = [...vercelProjects, ...netlifyProjects, ...railwayProjects, ...renderServices]

  // Filter deployments based on search
  const filteredDeployments = allDeployments.filter(deployment => {
    if (!searchTerm) return true
    const name = deployment.name || ''
    const integration = deployment.integration || ''
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           integration.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const isLoading = vercelLoading || netlifyLoading || railwayLoading || renderLoading || integrationsLoading

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'vercel': return <Zap className="h-4 w-4" />
      case 'netlify': return <Globe className="h-4 w-4" />
      case 'railway': return <Rocket className="h-4 w-4" />
      case 'render': return <Server className="h-4 w-4" />
      case 'aws': return <span className="text-base">☁️</span>
      case 'heroku': return <span className="text-base">💜</span>
      case 'azure': return <span className="text-base">🔷</span>
      case 'gcp': return <span className="text-base">🌐</span>
      default: return <Server className="h-4 w-4" />
    }
  }

  const getStatusBadge = (deployment: any) => {
    if (deployment.provider === 'vercel') {
      const state = deployment.latestDeployment?.state || 'unknown'
      switch (state) {
        case 'READY': return <Badge variant="default" className="text-xs">Live</Badge>
        case 'BUILDING': return <Badge variant="secondary" className="text-xs">Building</Badge>
        case 'ERROR': return <Badge variant="destructive" className="text-xs">Error</Badge>
        default: return <Badge variant="outline" className="text-xs">{state}</Badge>
      }
    } else if (deployment.provider === 'netlify') {
      const state = deployment.state || deployment.published_deploy?.state || 'unknown'
      switch (state) {
        case 'current': 
        case 'ready': return <Badge variant="default" className="text-xs">Live</Badge>
        case 'building': return <Badge variant="secondary" className="text-xs">Building</Badge>
        case 'error': return <Badge variant="destructive" className="text-xs">Error</Badge>
        default: return <Badge variant="outline" className="text-xs">{state}</Badge>
      }
    } else {
      // Railway/Render - basic status
      return <Badge variant="default" className="text-xs">Active</Badge>
    }
  }

  const getDeploymentUrl = (deployment: any) => {
    if (deployment.provider === 'vercel') {
      return `https://vercel.com/${deployment.accountId}/${deployment.name}`
    } else if (deployment.provider === 'netlify') {
      return deployment.url || deployment.ssl_url
    } else if (deployment.provider === 'railway') {
      return deployment.url || '#'
    } else if (deployment.provider === 'render') {
      return deployment.serviceUrl || '#'
    }
    return '#'
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold font-mono tracking-tight truncate">Deployments</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your deployments and hosting integrations
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <CreateDeploymentDialog />
            <Button 
              variant="outline" 
              onClick={() => setActiveTab(activeTab === "deployments" ? "integrations" : "deployments")}
              className="whitespace-nowrap"
            >
              <Settings className="mr-2 h-4 w-4" />
              {activeTab === "deployments" ? "Manage Integrations" : "View Deployments"}
            </Button>
          </div>
        </div>
      </div>

      {activeTab === 'deployments' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search deployments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full max-w-md"
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {filteredDeployments.length} deployment{filteredDeployments.length === 1 ? '' : 's'}
              {deploymentIntegrations.length > 0 && (
                <span className="ml-2">
                  from {deploymentIntegrations.length} account{deploymentIntegrations.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <div className="text-muted-foreground text-sm">Loading deployments...</div>
              </div>
            </div>
          ) : filteredDeployments.length === 0 ? (
            <Card className="w-full">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-center space-y-4 max-w-md">
                  <div className="text-muted-foreground">
                    {deploymentIntegrations.length === 0 
                      ? "No deployment integrations found. Connect your Vercel, Netlify, Railway, or Render account to get started."
                      : "No deployments found in your connected accounts."
                    }
                  </div>
                  {deploymentIntegrations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Switch to the Integrations tab to add your deployment accounts.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Deployments from your connected accounts will appear here automatically.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {filteredDeployments.map((deployment: any) => (
                <Card key={`${deployment.provider}-${deployment.id}`} className="group h-full transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 border-0 bg-gradient-to-br from-card to-card/95">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-xl flex items-center gap-3 truncate group-hover:text-primary transition-colors font-mono">
                          {getProviderIcon(deployment.provider)}
                          <span className="truncate">{deployment.name}</span>
                        </CardTitle>
                        <CardDescription className="mt-2 text-sm leading-relaxed">
                          {deployment.framework || deployment.type || "Deployment"}
                        </CardDescription>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(deployment)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                      <h4 className="text-sm font-semibold text-foreground">Deployment Info</h4>
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Created</span>
                          <span className="font-medium">{formatDate(new Date(deployment.createdAt || deployment.created_at || Date.now()))}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Provider</span>
                          <span className="font-medium capitalize">{deployment.provider}</span>
                        </div>
                        {deployment.url && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">URL</span>
                            <a
                              href={deployment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary hover:text-primary/80 transition-colors truncate max-w-[120px]"
                            >
                              {deployment.url.replace(/^https?:\/\//, '')}
                            </a>
                          </div>
                        )}
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Integration</span>
                            <span className="font-medium">{deployment.integration}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <DeploymentDetailsModal 
                        deployment={deployment} 
                        integration={deploymentIntegrations.find(i => i.name === deployment.integration)}
                      >
                        <Button variant="outline" size="sm" className="w-full font-medium">
                          View Details
                        </Button>
                      </DeploymentDetailsModal>
                      
                      <Button
                        variant="default"
                        size="sm"
                        className="font-medium"
                        asChild
                      >
                        <a
                          href={getDeploymentUrl(deployment)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-semibold mb-2">Connected Deployment Accounts</h2>
            <p className="text-sm text-muted-foreground">
              Manage your hosting platform integrations and API tokens
            </p>
          </div>
          
          {integrationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <div className="text-muted-foreground text-sm">Loading integrations...</div>
              </div>
            </div>
          ) : deploymentIntegrations.length === 0 ? (
            <Card className="w-full">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-center space-y-4 max-w-md">
                  <div className="text-muted-foreground">
                    No deployment integrations found. Connect your Vercel, Netlify, Railway, or Render account to get started.
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ll need API tokens from your deployment platforms to get started.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {deploymentIntegrations.map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}