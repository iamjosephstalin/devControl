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
import { Plus, Eye, EyeOff, Edit, Trash2, Copy, Filter, Grid3x3, List, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { CreateSecretDialog } from "@/components/secrets/create-dialog"
import { formatDate } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all")
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
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
  })

  const { data: allSecrets = [], isLoading } = useQuery<Secret[]>({
    queryKey: ["secrets"],
    queryFn: async () => {
      const res = await fetch("/api/secrets")
      if (!res.ok) throw new Error("Failed to fetch secrets")
      return res.json()
    },
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
    if (revealedSecrets.has(id)) {
      setRevealedSecrets((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } else {
      setRevealedSecrets((prev) => new Set(prev).add(id))
    }
  }

  const copyToClipboard = async (id: string) => {
    try {
      const res = await fetch(`/api/secrets/${id}`)
      const data = await res.json()
      await navigator.clipboard.writeText(data.value)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error("Failed to copy secret", error)
    }
  }

  const typeColors: Record<string, string> = {
    api_key: "bg-blue-500/10 text-blue-500",
    ssh: "bg-purple-500/10 text-purple-500",
    password: "bg-red-500/10 text-red-500",
    env_var: "bg-green-500/10 text-green-500",
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

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight">Secrets</h1>
          <p className="text-muted-foreground">
            Manage your encrypted secrets and credentials
          </p>
        </div>
        <div className="flex items-center gap-4">
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
            <Plus className="mr-2 h-4 w-4" />
            New Secret
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? (
        filteredSecrets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No secrets yet</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Secret
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSecrets.map((secret) => {
              const isRevealed = revealedSecrets.has(secret.id)
              return (
                <Card key={secret.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>{secret.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {secret.description || "No description"}
                        </CardDescription>
                      </div>
                      <Badge
                        className={
                          typeColors[secret.type] || typeColors.other
                        }
                      >
                        {secret.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        {secret.project ? (
                          <Badge variant="outline" className="mb-2">{secret.project.title}</Badge>
                        ) : (
                          <Badge variant="secondary" className="mb-2">General</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Created {formatDate(secret.createdAt)}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
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
                          onClick={() => copyToClipboard(secret.id)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          {copiedId === secret.id ? "Copied!" : "Copy"}
                        </Button>
                        <Button
                          variant="outline"
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
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
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
                      const isRevealed = revealedSecrets.has(secret.id)
                      return (
                        <TableRow key={secret.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{secret.name}</TableCell>
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
                                <Trash2 className="h-4 w-4 text-destructive" />
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
    </div>
  )
}
