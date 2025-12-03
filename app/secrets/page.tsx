"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Plus, Eye, EyeOff, Edit, Trash2, Copy, Filter, Grid3x3, List, ArrowUpDown, ArrowUp, ArrowDown, FileText } from "lucide-react"
import { CreateSecretDialog } from "@/components/secrets/create-dialog"
import { LockScreen } from "@/components/secrets/lock-screen"
import { formatDate } from "@/lib/utils"
import { PageContainer, PageHeader, ViewModeToggle } from "@/components/layout/page-header"
import { PageContent, PageGrid, EmptyState } from "@/components/layout/page-content"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

interface Secret {
  id: string
  name: string
  type: string
  description: string | null
  project: {
    id: string
    title: string
  } | null
  createdAt: string
  updatedAt: string
}

type ViewMode = "grid" | "list"
type SortField = "name" | "type" | "project" | "createdAt" | "updatedAt"
type SortDirection = "asc" | "desc"

export default function SecretsPage() {
  const queryClient = useQueryClient()
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all")
  const [revealedSecrets, setRevealedSecrets] = useState<Map<string, string>>(new Map())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [sortField, setSortField] = useState<SortField>("updatedAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Fetch projects for filtering
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json()
    },
    enabled: isUnlocked,
  })

  const { data: allSecrets = [], isLoading } = useQuery<Secret[]>({
    queryKey: ["secrets"],
    queryFn: async () => {
      const res = await fetch("/api/secrets")
      if (!res.ok) throw new Error("Failed to fetch secrets")
      return res.json()
    },
    enabled: isUnlocked,
  })

  // Filter secrets based on selected project
  const filteredSecrets = useMemo(() => {
    if (selectedProjectId === "general") {
      return allSecrets.filter((s) => !s.project)
    }
    if (selectedProjectId !== "all" && selectedProjectId) {
      return allSecrets.filter((s) => s.project?.id === selectedProjectId)
    }
    return allSecrets
  }, [allSecrets, selectedProjectId])

  // Sort secrets
  const sortedSecrets = useMemo(() => {
    const sorted = [...filteredSecrets]
    sorted.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "type":
          aValue = a.type.toLowerCase()
          bValue = b.type.toLowerCase()
          break
        case "project":
          aValue = a.project?.title || ""
          bValue = b.project?.title || ""
          break
        case "createdAt":
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case "updatedAt":
          aValue = new Date(a.updatedAt).getTime()
          bValue = new Date(b.updatedAt).getTime()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredSecrets, sortField, sortDirection])

  // Paginate secrets
  const paginatedSecrets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sortedSecrets.slice(startIndex, endIndex)
  }, [sortedSecrets, currentPage])

  const totalPages = Math.ceil(sortedSecrets.length / itemsPerPage)

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/secrets/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete secret")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secrets"] })
    },
  })

  const toggleReveal = async (id: string) => {
    console.log("🔍 toggleReveal called for ID:", id)
    console.log("Current revealed secrets:", Array.from(revealedSecrets.keys()))
    
    if (revealedSecrets.has(id)) {
      console.log("📖 Hiding secret:", id)
      setRevealedSecrets((prev) => {
        const next = new Map(prev)
        next.delete(id)
        console.log("✅ Secret hidden, new map size:", next.size)
        return next
      })
    } else {
      console.log("🔐 Revealing secret:", id)
      try {
        console.log("📡 Fetching secret from API:", `/api/secrets/${id}`)
        const res = await fetch(`/api/secrets/${id}`)
        console.log("📡 API Response status:", res.status, res.statusText)
        
        if (!res.ok) {
          const errorText = await res.text()
          console.error("❌ API Error response:", errorText)
          throw new Error(`Failed to fetch secret value: ${res.status} - ${errorText}`)
        }
        
        const data = await res.json()
        console.log("📦 Received data:", { ...data, value: data.value ? "[REDACTED]" : "null" })
        
        setRevealedSecrets((prev) => {
          const next = new Map(prev).set(id, data.value)
          console.log("✅ Secret revealed, new map size:", next.size)
          return next
        })
      } catch (error) {
        console.error("❌ Failed to reveal secret", error)
        alert(`Failed to reveal secret: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const copyToClipboard = async (id: string) => {
    console.log("📋 copyToClipboard called for ID:", id)
    
    try {
      let value = revealedSecrets.get(id)
      console.log("📋 Value from revealed secrets:", value ? "[REDACTED]" : "null")
      
      if (!value) {
        console.log("📡 Value not in memory, fetching from API...")
        const res = await fetch(`/api/secrets/${id}`)
        console.log("📡 Copy API Response status:", res.status, res.statusText)
        
        if (!res.ok) {
          const errorText = await res.text()
          console.error("❌ Copy API Error response:", errorText)
          throw new Error(`Failed to fetch secret for copy: ${res.status} - ${errorText}`)
        }
        
        const data = await res.json()
        console.log("📦 Copy received data:", { ...data, value: data.value ? "[REDACTED]" : "null" })
        value = data.value
      }
      
      if (value) {
        console.log("📋 Attempting to copy to clipboard...")
        await navigator.clipboard.writeText(value)
        console.log("✅ Successfully copied to clipboard")
        
        setCopiedId(id)
        console.log("✅ Set copied state for:", id)
        
        setTimeout(() => {
          setCopiedId(null)
          console.log("🔄 Cleared copied state")
        }, 2000)
      } else {
        console.warn("⚠️ No value to copy")
        alert("No value found to copy")
      }
    } catch (error) {
      console.error("❌ Failed to copy secret", error)
      alert(`Failed to copy secret: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const typeColors: Record<string, string> = {
    api_key: "bg-blue-500/10 text-blue-500",
    ssh: "bg-purple-500/10 text-purple-500",
    password: "bg-red-500/10 text-red-500",
    env_var: "bg-green-500/10 text-green-500",
    markdown: "bg-yellow-500/10 text-yellow-500",
    other: "bg-gray-500/10 text-gray-500",
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  if (!isUnlocked) {
    return <LockScreen onUnlock={() => setIsUnlocked(true)} />
  }

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <PageContainer>
      <PageHeader
        title="Secrets Vault"
        description="Securely manage your encrypted secrets and notes"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="general">General</SelectItem>
              {projects.map((project: any) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 border rounded-md">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="rounded-r-none"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          New Secret
        </Button>
      </PageHeader>

      {viewMode === "grid" ? (
        filteredSecrets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No secrets yet</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Create Your First Secret
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedSecrets.map((secret) => {
              const revealedValue = revealedSecrets.get(secret.id)
              const isRevealed = !!revealedValue

              return (
                <Card key={secret.id} className="group flex flex-col transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 border-0 bg-gradient-to-br from-card to-card/95">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="flex items-center gap-3 break-all text-xl font-mono group-hover:text-primary transition-colors">
                          {secret.type === 'markdown' && <FileText className="h-5 w-5 shrink-0" />}
                          {secret.name}
                        </CardTitle>
                        <CardDescription className="mt-2 text-sm leading-relaxed">
                          {secret.description || "No description provided"}
                        </CardDescription>
                      </div>
                      <Badge
                        className={`${
                          typeColors[secret.type] || typeColors.other
                        } shrink-0 font-medium px-2 py-1`}
                      >
                        {secret.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      {secret.project ? (
                        <Badge variant="outline" className="text-xs px-2 py-1 font-medium">
                          📁 {secret.project.title}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs px-2 py-1 font-medium bg-primary/10 text-primary">
                          🌐 General
                        </Badge>
                      )}
                    </div>

                    {isRevealed && (
                      <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-foreground">Secret Content</h4>
                        {secret.type === 'markdown' ? (
                          <div className="overflow-auto max-h-[300px] prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({ node, inline, className, children, ...props }: any) {
                                  const match = /language-(\w+)/.exec(className || '')
                                  return !inline && match ? (
                                    <SyntaxHighlighter
                                      {...props}
                                      style={vscDarkPlus}
                                      language={match[1]}
                                      PreTag="div"
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code {...props} className={className}>
                                      {children}
                                    </code>
                                  )
                                }
                              }}
                            >
                              {revealedValue || ''}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="rounded bg-card border p-3 font-mono text-sm break-all max-h-[200px] overflow-auto">
                            {revealedValue || 'No content'}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex-1" />

                    <div className="rounded-lg border bg-muted/30 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Created</span>
                        <span className="font-medium">{formatDate(secret.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-medium"
                        onClick={() => toggleReveal(secret.id)}
                      >
                        {isRevealed ? (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Reveal
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-medium"
                        onClick={() => copyToClipboard(secret.id)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {copiedId === secret.id ? "Copied!" : "Copy"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-medium hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to delete this secret?"
                            )
                          ) {
                            deleteMutation.mutate(secret.id)
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Secrets ({filteredSecrets.length})</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Showing {paginatedSecrets.length} of {filteredSecrets.length}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Name
                        <SortIcon field="name" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("type")}
                    >
                      <div className="flex items-center">
                        Type
                        <SortIcon field="type" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("project")}
                    >
                      <div className="flex items-center">
                        Project
                        <SortIcon field="project" />
                      </div>
                    </TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("createdAt")}
                    >
                      <div className="flex items-center">
                        Created
                        <SortIcon field="createdAt" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSecrets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <p className="text-muted-foreground">No secrets found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSecrets.map((secret) => {
                      const revealedValue = revealedSecrets.get(secret.id)
                      const isRevealed = !!revealedValue
                      return (
                        <TableRow key={secret.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {secret.type === 'markdown' && <FileText className="h-4 w-4 text-muted-foreground" />}
                              {secret.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                typeColors[secret.type] || typeColors.other
                              }
                            >
                              {secret.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {secret.project ? (
                              <Badge variant="secondary">{secret.project.title}</Badge>
                            ) : (
                              <Badge variant="outline">General</Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {secret.description || "—"}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {formatDate(secret.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleReveal(secret.id)}
                              >
                                {isRevealed ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(secret.id)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Are you sure you want to delete this secret?"
                                    )
                                  ) {
                                    deleteMutation.mutate(secret.id)
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={
                      currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )
                  }
                  return null
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      <CreateSecretDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </PageContainer>
  )
}
