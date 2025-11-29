"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ExternalLink,
  Github,
  GitBranch,
  GitFork,
  Star,
  CheckCircle2,
  Loader2,
  Search,
  Filter,
  ArrowUpDown,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useMemo } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchGitHubRepos } from "@/lib/github"
import { fetchGitLabRepos } from "@/lib/gitlab"
import { fetchBitbucketRepos } from "@/lib/bitbucket"

type Provider = "github" | "gitlab" | "bitbucket"

type SortOption = "updated" | "stars" | "forks" | "name" | "created"
type FilterOption = "all" | "public" | "private" | "archived"

export default function VersionControlPage() {
  const [activeProvider, setActiveProvider] = useState<Provider>("github")
  const [tokens, setTokens] = useState<Record<Provider, string>>({
    github: "",
    gitlab: "",
    bitbucket: "",
  })
  const [gitlabUrl, setGitlabUrl] = useState("https://gitlab.com")
  const [bitbucketUsername, setBitbucketUsername] = useState("")
  const [connectedProviders, setConnectedProviders] = useState<Set<Provider>>(new Set())
  const [sortBy, setSortBy] = useState<SortOption>("updated")
  const [filterBy, setFilterBy] = useState<FilterOption>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [languageFilter, setLanguageFilter] = useState("all")

  const handleTokenChange = (provider: Provider, value: string) => {
    setTokens((prev) => ({ ...prev, [provider]: value }))
  }

  const handleConnect = (provider: Provider) => {
    if (provider === "bitbucket" && !bitbucketUsername) return
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
    if (provider === "bitbucket") {
      setBitbucketUsername("")
    }
  }

  // GitHub Query
  const { data: githubRepos = [], isLoading: githubLoading } = useQuery({
    queryKey: ["github-repos", tokens.github],
    queryFn: () => fetchGitHubRepos(tokens.github),
    enabled: connectedProviders.has("github") && !!tokens.github,
  })

  // GitLab Query
  const { data: gitlabRepos = [], isLoading: gitlabLoading } = useQuery({
    queryKey: ["gitlab-repos", tokens.gitlab, gitlabUrl],
    queryFn: () => fetchGitLabRepos(tokens.gitlab, gitlabUrl),
    enabled: connectedProviders.has("gitlab") && !!tokens.gitlab,
  })

  // Bitbucket Query
  const { data: bitbucketRepos = [], isLoading: bitbucketLoading } = useQuery({
    queryKey: ["bitbucket-repos", bitbucketUsername, tokens.bitbucket],
    queryFn: () => fetchBitbucketRepos(bitbucketUsername, tokens.bitbucket),
    enabled:
      connectedProviders.has("bitbucket") &&
      !!tokens.bitbucket &&
      !!bitbucketUsername,
  })

  // Get unique languages from repos
  const languages = useMemo(() => {
    const langSet = new Set<string>()
    githubRepos.forEach((repo: any) => {
      if (repo.language) langSet.add(repo.language)
    })
    gitlabRepos.forEach((repo: any) => {
      if (repo.language) langSet.add(repo.language)
    })
    bitbucketRepos.forEach((repo: any) => {
      if (repo.language) langSet.add(repo.language)
    })
    return Array.from(langSet).sort()
  }, [githubRepos, gitlabRepos, bitbucketRepos])

  // Filter and sort repos
  const filteredRepos = useMemo(() => {
    let repos: any[] = []
    if (activeProvider === "github") repos = [...githubRepos]
    else if (activeProvider === "gitlab") repos = [...gitlabRepos]
    else if (activeProvider === "bitbucket") repos = [...bitbucketRepos]

    // Search filter
    if (searchQuery) {
      repos = repos.filter(
        (repo: any) =>
          repo.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Visibility filter
    if (filterBy === "public") {
      repos = repos.filter((repo: any) => {
        if (activeProvider === "github") return !repo.private
        if (activeProvider === "gitlab") return repo.visibility === "public"
        if (activeProvider === "bitbucket") return !repo.is_private
        return true
      })
    } else if (filterBy === "private") {
      repos = repos.filter((repo: any) => {
        if (activeProvider === "github") return repo.private
        if (activeProvider === "gitlab") return repo.visibility === "private"
        if (activeProvider === "bitbucket") return repo.is_private
        return true
      })
    } else if (filterBy === "archived") {
      repos = repos.filter((repo: any) => repo.archived)
    }

    // Language filter
    if (languageFilter && languageFilter !== "all") {
      repos = repos.filter((repo: any) => repo.language === languageFilter)
    }

    // Sort
    repos.sort((a: any, b: any) => {
      switch (sortBy) {
        case "stars":
          return (
            (b.stargazers_count || b.star_count || 0) -
            (a.stargazers_count || a.star_count || 0)
          )
        case "forks":
          return (b.forks_count || 0) - (a.forks_count || 0)
        case "name":
          return a.name.localeCompare(b.name)
        case "created":
          return (
            new Date(b.created_at || b.created_on).getTime() -
            new Date(a.created_at || a.created_on).getTime()
          )
        case "updated":
        default:
          return (
            new Date(
              b.updated_at || b.last_activity_at || b.updated_on
            ).getTime() -
            new Date(a.updated_at || a.last_activity_at || a.updated_on).getTime()
          )
      }
    })

    return repos
  }, [
    activeProvider,
    githubRepos,
    gitlabRepos,
    bitbucketRepos,
    sortBy,
    filterBy,
    searchQuery,
    languageFilter,
  ])

  const providerConfig = {
    github: {
      name: "GitHub",
      icon: Github,
      color: "text-black dark:text-white",
      tokenUrl: "https://github.com/settings/tokens",
      tokenPlaceholder: "ghp_xxxxxxxxxxxx",
      description: "Connect your GitHub account to view repositories",
    },
    gitlab: {
      name: "GitLab",
      icon: GitBranch,
      color: "text-[#FC6D26]",
      tokenUrl: "https://gitlab.com/-/user_settings/personal_access_tokens",
      tokenPlaceholder: "glpat-xxxxxxxxxxxx",
      description: "Connect your GitLab account to view repositories",
    },
    bitbucket: {
      name: "Bitbucket",
      icon: GitFork,
      color: "text-[#0052CC]",
      tokenUrl: "https://bitbucket.org/account/settings/app-passwords/",
      tokenPlaceholder: "App Password",
      description: "Connect your Bitbucket account to view repositories",
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
            {provider === "gitlab" && (
              <div>
                <Label htmlFor={`${provider}-url`}>{config.name} Instance URL</Label>
                <Input
                  id={`${provider}-url`}
                  type="text"
                  value={gitlabUrl}
                  onChange={(e) => setGitlabUrl(e.target.value)}
                  placeholder="https://gitlab.com"
                  className="mt-2 font-mono"
                />
              </div>
            )}
            {provider === "bitbucket" && (
              <div>
                <Label htmlFor={`${provider}-username`}>Bitbucket Username</Label>
                <Input
                  id={`${provider}-username`}
                  type="text"
                  value={bitbucketUsername}
                  onChange={(e) => setBitbucketUsername(e.target.value)}
                  placeholder="your-username"
                  className="mt-2"
                />
              </div>
            )}
            <div>
              <Label htmlFor={`${provider}-token`}>
                {provider === "bitbucket" ? "App Password" : `${config.name} Personal Access Token`}
              </Label>
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
            <Button
              onClick={() => handleConnect(provider)}
              disabled={!tokens[provider] || (provider === "bitbucket" && !bitbucketUsername)}
            >
              Connect
            </Button>
          </CardContent>
        </Card>
      )
    }

    return null
  }

  const renderRepos = (provider: Provider) => {
    const config = providerConfig[provider]
    const Icon = config.icon
    const isLoading =
      (provider === "github" && githubLoading) ||
      (provider === "gitlab" && gitlabLoading) ||
      (provider === "bitbucket" && bitbucketLoading)

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )
    }

    if (filteredRepos.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No repositories found</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <Label htmlFor="search" className="flex items-center gap-2 mb-2">
                  <Search className="h-4 w-4" />
                  Search
                </Label>
                <Input
                  id="search"
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="sort" className="flex items-center gap-2 mb-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Sort By
                </Label>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated">Last Updated</SelectItem>
                    <SelectItem value="stars">Stars</SelectItem>
                    <SelectItem value="forks">Forks</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="created">Created Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filter" className="flex items-center gap-2 mb-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Label>
                <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    {provider === "github" && (
                      <SelectItem value="archived">Archived</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="language" className="mb-2">Language</Label>
                <Select value={languageFilter} onValueChange={setLanguageFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All languages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    {languages.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Repos Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRepos.map((repo: any) => {
            const repoUrl =
              provider === "github"
                ? repo.html_url
                : provider === "gitlab"
                ? repo.web_url
                : repo.links?.html?.href

            return (
              <Card key={repo.id || repo.uuid}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${config.color}`} />
                        {repo.name}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {repo.description || "No description"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {repo.language && (
                        <Badge variant="outline">{repo.language}</Badge>
                      )}
                      {provider === "github" && (
                        <>
                          {repo.private ? (
                            <Badge variant="secondary">Private</Badge>
                          ) : (
                            <Badge variant="outline">Public</Badge>
                          )}
                          {repo.archived && (
                            <Badge variant="destructive">Archived</Badge>
                          )}
                        </>
                      )}
                      {provider === "gitlab" && (
                        <Badge
                          variant={
                            repo.visibility === "public" ? "outline" : "secondary"
                          }
                        >
                          {repo.visibility}
                        </Badge>
                      )}
                      {provider === "bitbucket" && (
                        <Badge variant={repo.is_private ? "secondary" : "outline"}>
                          {repo.is_private ? "Private" : "Public"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        {repo.stargazers_count || repo.star_count || 0}
                      </div>
                      <div className="flex items-center gap-1">
                        <GitFork className="h-4 w-4" />
                        {repo.forks_count || 0}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      Updated{" "}
                      {formatDate(
                        repo.updated_at || repo.last_activity_at || repo.updated_on
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href={repoUrl} target="_blank" rel="noopener noreferrer">
                        View on {config.name} <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-mono tracking-tight">
          Version Control
        </h1>
        <p className="text-muted-foreground">
          Connect and manage your repositories across multiple platforms
        </p>
      </div>

      <Tabs value={activeProvider} onValueChange={(v) => setActiveProvider(v as Provider)}>
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
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
                        {config.name} Repositories
                      </h2>
                      <p className="text-muted-foreground">{config.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleDisconnect(provider as Provider)}
                    >
                      Disconnect
                    </Button>
                  </div>
                  {renderRepos(provider as Provider)}
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}

