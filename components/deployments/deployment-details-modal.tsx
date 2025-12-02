"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ExternalLink, 
  GitBranch, 
  User, 
  Clock, 
  Code, 
  Activity,
  Terminal,
  Zap,
  Calendar
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { fetchVercelDeployments, fetchVercelDeploymentLogs, fetchVercelDeploymentBuild } from "@/lib/vercel"
import { getIntegrationToken } from "@/lib/integrations"

interface DeploymentDetailsModalProps {
  deployment: any
  integration: any
  children: React.ReactNode
}

export function DeploymentDetailsModal({ deployment, integration, children }: DeploymentDetailsModalProps) {
  const [open, setOpen] = useState(false)

  // Fetch recent deployments for this project
  const { data: deployments = [], isLoading: deploymentsLoading } = useQuery({
    queryKey: ['deployment-details', deployment.id || deployment.uid, integration.id],
    queryFn: async () => {
      if (deployment.provider !== 'vercel') return []
      
      const token = await getIntegrationToken(integration.id)
      const teamId = integration.config?.teamId
      return fetchVercelDeployments(token, deployment.id || deployment.name, teamId)
    },
    enabled: open && deployment.provider === 'vercel'
  })

  // Get the latest deployment for logs
  const latestDeployment = deployments[0] || deployment

  // Fetch deployment logs
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['deployment-logs', latestDeployment.uid || latestDeployment.name, integration.id],
    queryFn: async () => {
      if (deployment.provider !== 'vercel' || !latestDeployment.uid) return []
      
      const token = await getIntegrationToken(integration.id)
      const teamId = integration.config?.teamId
      return fetchVercelDeploymentLogs(token, latestDeployment.uid, teamId)
    },
    enabled: open && deployment.provider === 'vercel' && !!latestDeployment.uid
  })

  // Fetch build details
  const { data: buildInfo, isLoading: buildLoading } = useQuery({
    queryKey: ['deployment-build', latestDeployment.uid || latestDeployment.name, integration.id],
    queryFn: async () => {
      if (deployment.provider !== 'vercel' || !latestDeployment.uid) return null
      
      const token = await getIntegrationToken(integration.id)
      const teamId = integration.config?.teamId
      return fetchVercelDeploymentBuild(token, latestDeployment.uid, teamId)
    },
    enabled: open && deployment.provider === 'vercel' && !!latestDeployment.uid
  })

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'READY': return 'default'
      case 'BUILDING': return 'secondary'
      case 'ERROR': return 'destructive'
      case 'QUEUED': return 'outline'
      case 'CANCELED': return 'secondary'
      default: return 'outline'
    }
  }

  const formatDuration = (start?: number, end?: number) => {
    if (!start || !end) return 'N/A'
    const duration = Math.round((end - start) / 1000)
    if (duration < 60) return `${duration}s`
    return `${Math.floor(duration / 60)}m ${duration % 60}s`
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {deployment.name}
          </DialogTitle>
          <DialogDescription>
            Deployment details and build information from {integration.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 overflow-hidden">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="deployments">History</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="build">Build</TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto max-h-[60vh]">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Deployment Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={getStatusColor(latestDeployment.state || 'unknown')}>
                        {latestDeployment.state || 'Unknown'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Created</span>
                      <span className="text-sm">
                        {formatDate(new Date(latestDeployment.createdAt || Date.now()))}
                      </span>
                    </div>
                    {latestDeployment.readyAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Duration</span>
                        <span className="text-sm">
                          {formatDuration(latestDeployment.createdAt, latestDeployment.readyAt)}
                        </span>
                      </div>
                    )}
                    {latestDeployment.url && (
                      <div className="pt-2">
                        <Button variant="outline" size="sm" asChild className="w-full">
                          <a href={latestDeployment.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Live Site
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {latestDeployment.meta && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Git Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {latestDeployment.meta.githubCommitMessage && (
                        <div>
                          <span className="text-sm text-muted-foreground">Commit</span>
                          <p className="text-sm font-mono bg-muted p-2 rounded mt-1">
                            {latestDeployment.meta.githubCommitMessage}
                          </p>
                        </div>
                      )}
                      {latestDeployment.meta.githubCommitSha && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">SHA</span>
                          <code className="text-sm">{latestDeployment.meta.githubCommitSha.substring(0, 7)}</code>
                        </div>
                      )}
                      {latestDeployment.meta.githubCommitRef && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Branch</span>
                          <div className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3" />
                            <span className="text-sm">{latestDeployment.meta.githubCommitRef}</span>
                          </div>
                        </div>
                      )}
                      {latestDeployment.meta.githubCommitAuthor && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Author</span>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="text-sm">{latestDeployment.meta.githubCommitAuthor}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="deployments" className="space-y-4">
              {deploymentsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading deployment history...</div>
              ) : deployments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No deployment history available</div>
              ) : (
                <div className="space-y-3">
                  {deployments.slice(0, 10).map((deploy: any) => (
                    <Card key={deploy.uid}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant={getStatusColor(deploy.state)}>
                              {deploy.state}
                            </Badge>
                            <div>
                              <p className="text-sm font-medium">
                                {deploy.meta?.githubCommitMessage || 'No commit message'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {deploy.meta?.githubCommitSha?.substring(0, 7)} • 
                                {formatDate(new Date(deploy.createdAt))}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {formatDuration(deploy.createdAt, deploy.readyAt)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              {logsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading logs...</div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No logs available</div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Terminal className="h-5 w-5" />
                      Deployment Logs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
                      {logs.map((log: any, index: number) => (
                        <div key={index} className="flex gap-2">
                          <span className="text-gray-500 text-xs">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span>{log.text}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="build" className="space-y-4">
              {buildLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading build info...</div>
              ) : !buildInfo ? (
                <div className="text-center py-8 text-muted-foreground">No build information available</div>
              ) : (
                <div className="space-y-4">
                  {buildInfo.builds && buildInfo.builds.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Code className="h-5 w-5" />
                          Build Steps
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {buildInfo.builds.map((build: any, index: number) => {
                            const renderOutput = () => {
                              if (!build.output) return 'No output'
                              if (typeof build.output === 'string') return build.output
                              if (typeof build.output === 'object') {
                                // Handle common Vercel build output objects
                                if (build.output.digest) {
                                  return `${build.output.type || 'File'} (${build.output.mode || 'static'})`
                                }
                                if (build.output.path) {
                                  return build.output.path
                                }
                                return Object.keys(build.output).join(', ')
                              }
                              return String(build.output)
                            }

                            return (
                              <div key={index} className="p-3 bg-muted rounded space-y-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{build.use || 'Build Step'}</p>
                                    <p className="text-sm text-muted-foreground">{build.src || 'No source specified'}</p>
                                  </div>
                                  {build.duration && (
                                    <Badge variant="outline" className="text-xs">
                                      {build.duration}ms
                                    </Badge>
                                  )}
                                </div>
                                
                                {build.output && (
                                  <div className="pt-1">
                                    <p className="text-sm text-muted-foreground">Output:</p>
                                    <p className="text-sm font-mono bg-background p-2 rounded border">
                                      {renderOutput()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}