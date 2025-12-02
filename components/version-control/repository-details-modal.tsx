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
  GitCommit, 
  GitPullRequest,
  Star,
  GitFork,
  Eye,
  Code,
  Calendar,
  Github
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { 
  fetchGitHubCommits, 
  fetchGitHubBranches, 
  fetchGitHubPullRequests,
  fetchGitHubRepoStats
} from "@/lib/github"
import { getIntegrationToken } from "@/lib/integrations"

interface RepositoryDetailsModalProps {
  repository: any
  integration: any
  children: React.ReactNode
}

export function RepositoryDetailsModal({ repository, integration, children }: RepositoryDetailsModalProps) {
  const [open, setOpen] = useState(false)

  // Extract owner and repo name
  const [owner, repoName] = repository.full_name?.split('/') || ['', repository.name]

  // Fetch commits
  const { data: commits = [], isLoading: commitsLoading } = useQuery({
    queryKey: ['repo-commits', repository.id, integration.id],
    queryFn: async () => {
      if (repository.provider !== 'github') return []
      
      const token = await getIntegrationToken(integration.id)
      return fetchGitHubCommits(token, owner, repoName, undefined, 20)
    },
    enabled: open && repository.provider === 'github' && !!owner && !!repoName
  })

  // Fetch branches
  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ['repo-branches', repository.id, integration.id],
    queryFn: async () => {
      if (repository.provider !== 'github') return []
      
      const token = await getIntegrationToken(integration.id)
      return fetchGitHubBranches(token, owner, repoName)
    },
    enabled: open && repository.provider === 'github' && !!owner && !!repoName
  })

  // Fetch pull requests
  const { data: pullRequests = [], isLoading: prsLoading } = useQuery({
    queryKey: ['repo-prs', repository.id, integration.id],
    queryFn: async () => {
      if (repository.provider !== 'github') return []
      
      const token = await getIntegrationToken(integration.id)
      return fetchGitHubPullRequests(token, owner, repoName, 'open')
    },
    enabled: open && repository.provider === 'github' && !!owner && !!repoName
  })

  // Fetch repository stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['repo-stats', repository.id, integration.id],
    queryFn: async () => {
      if (repository.provider !== 'github') return null
      
      const token = await getIntegrationToken(integration.id)
      return fetchGitHubRepoStats(token, owner, repoName)
    },
    enabled: open && repository.provider === 'github' && !!owner && !!repoName
  })

  const getPRStateColor = (state: string) => {
    switch (state) {
      case 'open': return 'default'
      case 'closed': return 'secondary'
      case 'merged': return 'default'
      default: return 'outline'
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            {repository.name}
          </DialogTitle>
          <DialogDescription>
            Repository details and activity from {integration.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 overflow-hidden">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="commits">Commits</TabsTrigger>
            <TabsTrigger value="branches">Branches</TabsTrigger>
            <TabsTrigger value="pulls">Pull Requests</TabsTrigger>
            <TabsTrigger value="stats">Insights</TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto max-h-[60vh]">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Repository Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Visibility</span>
                      <Badge variant={repository.private ? "secondary" : "default"}>
                        {repository.private ? "Private" : "Public"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Language</span>
                      <span className="text-sm">{repository.language || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Default Branch</span>
                      <div className="flex items-center gap-1">
                        <GitBranch className="h-3 w-3" />
                        <span className="text-sm">{repository.default_branch}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Updated</span>
                      <span className="text-sm">{formatDate(new Date(repository.updated_at))}</span>
                    </div>
                    {repository.description && (
                      <div>
                        <span className="text-sm text-muted-foreground">Description</span>
                        <p className="text-sm mt-1">{repository.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        <span className="text-sm text-muted-foreground">Stars</span>
                      </div>
                      <span className="text-sm font-medium">{repository.stargazers_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <GitFork className="h-3 w-3" />
                        <span className="text-sm text-muted-foreground">Forks</span>
                      </div>
                      <span className="text-sm font-medium">{repository.forks_count}</span>
                    </div>
                    {repository.open_issues_count !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Open Issues</span>
                        <span className="text-sm font-medium">{repository.open_issues_count}</span>
                      </div>
                    )}
                    {repository.size !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Size</span>
                        <span className="text-sm">{Math.round(repository.size / 1024)} MB</span>
                      </div>
                    )}
                    <div className="pt-2">
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <a href={repository.html_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View on GitHub
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="commits" className="space-y-4">
              {commitsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading commits...</div>
              ) : commits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No commits available</div>
              ) : (
                <div className="space-y-3">
                  {commits.map((commit: any) => (
                    <Card key={commit.sha}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{commit.commit.message}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {commit.author?.login || commit.commit.author.name}
                              </div>
                              <span>•</span>
                              <code className="bg-muted px-1 rounded">{commit.sha.substring(0, 7)}</code>
                              <span>•</span>
                              {formatDate(new Date(commit.commit.author.date))}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={commit.html_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="branches" className="space-y-4">
              {branchesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading branches...</div>
              ) : branches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No branches available</div>
              ) : (
                <div className="space-y-3">
                  {branches.map((branch: any) => (
                    <Card key={branch.name}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GitBranch className="h-4 w-4" />
                            <span className="font-medium">{branch.name}</span>
                            {branch.name === repository.default_branch && (
                              <Badge variant="outline" className="text-xs">default</Badge>
                            )}
                            {branch.protected && (
                              <Badge variant="secondary" className="text-xs">protected</Badge>
                            )}
                          </div>
                          <code className="text-sm text-muted-foreground">
                            {branch.commit.sha.substring(0, 7)}
                          </code>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pulls" className="space-y-4">
              {prsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading pull requests...</div>
              ) : pullRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No open pull requests</div>
              ) : (
                <div className="space-y-3">
                  {pullRequests.map((pr: any) => (
                    <Card key={pr.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <GitPullRequest className="h-4 w-4" />
                              <span className="font-medium">#{pr.number}</span>
                              <Badge variant={getPRStateColor(pr.state)}>{pr.state}</Badge>
                            </div>
                            <p className="text-sm mt-1 truncate">{pr.title}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {pr.user.login}
                              </div>
                              <span>•</span>
                              <span>{pr.head.ref} → {pr.base.ref}</span>
                              <span>•</span>
                              {formatDate(new Date(pr.created_at))}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={pr.html_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              {statsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading insights...</div>
              ) : !stats ? (
                <div className="text-center py-8 text-muted-foreground">No insights available</div>
              ) : (
                <div className="space-y-4">
                  {/* Languages */}
                  {stats.languages && Object.keys(stats.languages).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Languages</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(stats.languages)
                            .sort(([,a], [,b]) => (b as number) - (a as number))
                            .slice(0, 10)
                            .map(([lang, bytes]) => {
                              const total = Object.values(stats.languages).reduce((sum: number, val: any) => sum + val, 0)
                              const percentage = Math.round(((bytes as number) / total) * 100)
                              return (
                                <div key={lang} className="flex items-center justify-between">
                                  <span className="text-sm">{lang}</span>
                                  <span className="text-sm text-muted-foreground">{percentage}%</span>
                                </div>
                              )
                            })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Contributors */}
                  {stats.contributors && stats.contributors.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Top Contributors</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {stats.contributors.slice(0, 5).map((contributor: any) => (
                            <div key={contributor.login} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs"
                                  style={{
                                    backgroundImage: `url(${contributor.avatar_url})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                  }}
                                  aria-label={contributor.login}
                                />
                                <span className="text-sm">{contributor.login}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {contributor.contributions} commits
                              </span>
                            </div>
                          ))}
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