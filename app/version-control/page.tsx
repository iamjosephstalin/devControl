"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ExternalLink,
  Github,
  GitBranch,
  GitFork,
  Star,
  Settings,
  Plus,
  Code,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { useState, useMemo } from "react"
import { fetchGitHubRepos } from "@/lib/github"
import { fetchGitLabRepos } from "@/lib/gitlab"
import { fetchBitbucketRepos } from "@/lib/bitbucket"
import { fetchIntegrations, getIntegrationToken } from "@/lib/integrations"
import { IntegrationCard } from "@/components/integrations/integration-card"
import { CreateVersionControlDialog } from "@/components/integrations/create-version-control-dialog"
import { RepositoryDetailsModal } from "@/components/version-control/repository-details-modal"

export default function VersionControlPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'repositories' | 'integrations'>('repositories')
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch all integrations
  const { data: integrations = [], isLoading: integrationsLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: fetchIntegrations
  })

  // Filter integrations by type (only Git providers)
  const gitIntegrationTypes = ['github', 'gitlab', 'bitbucket']
  const gitIntegrations = integrations.filter(i => gitIntegrationTypes.includes(i.type) && i.status === 'connected')
  const githubIntegrations = integrations.filter(i => i.type === 'github' && i.status === 'connected')
  const gitlabIntegrations = integrations.filter(i => i.type === 'gitlab' && i.status === 'connected')
  const bitbucketIntegrations = integrations.filter(i => i.type === 'bitbucket' && i.status === 'connected')

  // GitHub repositories from all connected integrations
  const { data: githubRepos = [], isLoading: githubLoading } = useQuery({
    queryKey: ["github-repos", githubIntegrations.map(i => i.id)],
    queryFn: async () => {
      const allRepos = []
      for (const integration of githubIntegrations) {
        try {
          const token = await getIntegrationToken(integration.id)
          const repos = await fetchGitHubRepos(token)
          allRepos.push(...repos.map(repo => ({ ...repo, integration: integration.name, provider: 'github' })))
        } catch (error) {
          console.error(`Failed to fetch repos from ${integration.name}:`, error)
        }
      }
      return allRepos
    },
    enabled: githubIntegrations.length > 0,
  })

  // GitLab repositories from all connected integrations
  const { data: gitlabRepos = [], isLoading: gitlabLoading } = useQuery({
    queryKey: ["gitlab-repos", gitlabIntegrations.map(i => i.id)],
    queryFn: async () => {
      const allRepos = []
      for (const integration of gitlabIntegrations) {
        try {
          const token = await getIntegrationToken(integration.id)
          const baseUrl = integration.config?.baseUrl || 'https://gitlab.com'
          const repos = await fetchGitLabRepos(token, baseUrl)
          allRepos.push(...repos.map(repo => ({ ...repo, integration: integration.name, provider: 'gitlab' })))
        } catch (error) {
          console.error(`Failed to fetch repos from ${integration.name}:`, error)
        }
      }
      return allRepos
    },
    enabled: gitlabIntegrations.length > 0,
  })

  // Bitbucket repositories from all connected integrations
  const { data: bitbucketRepos = [], isLoading: bitbucketLoading } = useQuery({
    queryKey: ["bitbucket-repos", bitbucketIntegrations.map(i => i.id)],
    queryFn: async () => {
      const allRepos = []
      for (const integration of bitbucketIntegrations) {
        try {
          const token = await getIntegrationToken(integration.id)
          const username = integration.config?.username
          if (username) {
            const repos = await fetchBitbucketRepos(username, token)
            allRepos.push(...repos.map(repo => ({ ...repo, integration: integration.name, provider: 'bitbucket' })))
          }
        } catch (error) {
          console.error(`Failed to fetch repos from ${integration.name}:`, error)
        }
      }
      return allRepos
    },
    enabled: bitbucketIntegrations.length > 0,
  })

  // Filter repositories based on search term
  const filteredRepos = useMemo(() => {
    const allRepos = [...githubRepos, ...gitlabRepos, ...bitbucketRepos]

    if (!searchTerm) return allRepos

    return allRepos.filter((repo: any) =>
      repo.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.name_with_namespace?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [githubRepos, gitlabRepos, bitbucketRepos, searchTerm])

  const isLoading = githubLoading || gitlabLoading || bitbucketLoading || integrationsLoading

  const getRepoIcon = (provider: string) => {
    switch (provider) {
      case 'github': return <Github className="h-4 w-4" />
      case 'gitlab': return <GitBranch className="h-4 w-4" />
      case 'bitbucket': return <GitBranch className="h-4 w-4" />
      default: return <GitBranch className="h-4 w-4" />
    }
  }

  const formatRepoData = (repo: any) => {
    // Normalize data structure across providers
    if (repo.provider === 'github') {
      return {
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        updatedAt: repo.updated_at,
        isPrivate: repo.private,
        isArchived: repo.archived
      }
    } else if (repo.provider === 'gitlab') {
      return {
        name: repo.name,
        fullName: repo.name_with_namespace,
        description: repo.description,
        url: repo.web_url,
        stars: repo.star_count,
        forks: repo.forks_count,
        language: repo.language,
        updatedAt: repo.last_activity_at,
        isPrivate: repo.visibility === 'private',
        isArchived: false
      }
    } else {
      return {
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.links?.html?.href,
        stars: 0,
        forks: 0,
        language: repo.language,
        updatedAt: repo.updated_on,
        isPrivate: repo.is_private,
        isArchived: false
      }
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold font-mono tracking-tight truncate">Version Control</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your Git repositories and integrations
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <CreateVersionControlDialog />
            <Button
              variant="outline"
              onClick={() => setActiveTab(activeTab === "repositories" ? "integrations" : "repositories")}
              className="whitespace-nowrap"
            >
              <Settings className="mr-2 h-4 w-4" />
              {activeTab === "repositories" ? "Manage Integrations" : "View Repositories"}
            </Button>
          </div>
        </div>
      </div>

      {activeTab === 'repositories' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search repositories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-md"
              />
            </div>
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {filteredRepos.length} repositor{filteredRepos.length === 1 ? 'y' : 'ies'}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <div className="text-muted-foreground text-sm">Loading repositories...</div>
              </div>
            </div>
          ) : filteredRepos.length === 0 ? (
            <Card className="w-full">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-center space-y-4 max-w-md">
                  <div className="text-muted-foreground">
                    {filteredRepos.length === 0 && !searchTerm
                      ? "No repositories found. Connect a Git provider to get started."
                      : "No repositories match your search."
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {filteredRepos.map((repo: any, index) => {
                const repoData = formatRepoData(repo)
                const repoId = repo.id || repo.uuid || index
                return (
                  <Card key={`${repo.provider}-${repoId}`} className="group h-full transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 border-0 bg-gradient-to-br from-card to-card/95">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-xl flex items-center gap-3 truncate group-hover:text-primary transition-colors font-mono">
                            {getRepoIcon(repo.provider)}
                            <span className="truncate">{repoData.name}</span>
                          </CardTitle>
                          <CardDescription className="mt-2 text-sm leading-relaxed">
                            {repoData.fullName}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <Badge variant={repoData.isPrivate ? "secondary" : "default"} className="text-xs px-2 py-1 font-medium">
                            {repoData.isPrivate ? "🔒 Private" : "🌐 Public"}
                          </Badge>
                          {repoData.isArchived && (
                            <Badge variant="outline" className="text-xs px-2 py-1">📦 Archived</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {repoData.description && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-foreground">Description</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {repoData.description}
                          </p>
                        </div>
                      )}

                      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-foreground">Repository Stats</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {repoData.language && (
                            <div className="space-y-1">
                              <span className="text-muted-foreground">Language</span>
                              <p className="font-medium">{repoData.language}</p>
                            </div>
                          )}
                          <div className="space-y-1">
                            <span className="text-muted-foreground">Stars</span>
                            <div className="flex items-center gap-1 font-medium">
                              <Star className="h-3 w-3" />
                              {repoData.stars}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-muted-foreground">Forks</span>
                            <div className="flex items-center gap-1 font-medium">
                              <GitFork className="h-3 w-3" />
                              {repoData.forks}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-muted-foreground">Updated</span>
                            <p className="font-medium">{formatDate(new Date(repoData.updatedAt))}</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Source</span>
                            <span className="font-medium">{repo.integration}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <RepositoryDetailsModal
                          repository={repo}
                          integration={gitIntegrations.find(i => i.name === repo.integration)}
                        >
                          <Button variant="outline" size="sm" className="w-full font-medium">
                            View Details
                          </Button>
                        </RepositoryDetailsModal>

                        <Button
                          variant="secondary"
                          size="sm"
                          className="font-medium"
                          onClick={() => {
                            const integration = gitIntegrations.find(i => i.name === repo.integration)
                            if (integration) {
                              toast.promise(
                                fetch('/api/ide/workspaces', {
                                  method: 'POST',
                                  body: JSON.stringify({
                                    repoUrl: repoData.url,
                                    name: repoData.name,
                                    integrationId: integration.id
                                  })
                                }).then(async res => {
                                  if (!res.ok) throw new Error("Failed to open workspace")
                                  return res.json()
                                }),
                                {
                                  loading: 'Opening workspace...',
                                  success: (data) => {
                                    router.push(`/version-control/ide/${data.workspaceId}`)
                                    return `Workspace ready`
                                  },
                                  error: 'Failed to open workspace'
                                }
                              )
                            }
                          }}
                        >
                          <Code className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="font-medium"
                          asChild
                        >
                          <a
                            href={repoData.url}
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
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-semibold mb-2">Connected Git Accounts</h2>
            <p className="text-sm text-muted-foreground">
              Manage your version control integrations
            </p>
          </div>

          {integrationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <div className="text-muted-foreground text-sm">Loading integrations...</div>
              </div>
            </div>
          ) : gitIntegrations.length === 0 ? (
            <Card className="w-full">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-center space-y-4 max-w-md">
                  <div className="text-muted-foreground">
                    No Git integrations configured yet. Connect your GitHub, GitLab, or Bitbucket account to get started.
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your repositories will appear automatically once connected.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {gitIntegrations.map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}