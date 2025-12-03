"use client"

import { useEffect, useState, useMemo } from "react"
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
import { Plus, ExternalLink, Edit, Trash2, Grid3x3, List, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { CreateProjectDialog } from "@/components/projects/create-dialog"
import { EditProjectDialog } from "@/components/projects/edit-dialog"
import { PageContainer, PageHeader, ViewModeToggle } from "@/components/layout/page-header"
import { PageContent, PageGrid, EmptyState } from "@/components/layout/page-content"
import { formatDate } from "@/lib/utils"

interface Project {
  id: string
  title: string
  description: string | null
  techStack: string
  githubRepo: string | null
  deployment: string
  status: string
  createdAt: string
  updatedAt: string
  tags: string | null
}

type ViewMode = "grid" | "list"
type SortField = "title" | "status" | "deployment" | "updatedAt" | "createdAt"
type SortDirection = "asc" | "desc"

export default function ProjectsPage() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [sortField, setSortField] = useState<SortField>("updatedAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json()
    },
  })

  // Sort projects
  const sortedProjects = useMemo(() => {
    const sorted = [...projects]
    sorted.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case "title":
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case "status":
          const statusOrder = { active: 3, paused: 2, completed: 1 }
          aValue = statusOrder[a.status as keyof typeof statusOrder] || 0
          bValue = statusOrder[b.status as keyof typeof statusOrder] || 0
          break
        case "deployment":
          aValue = a.deployment.toLowerCase()
          bValue = b.deployment.toLowerCase()
          break
        case "updatedAt":
          aValue = new Date(a.updatedAt).getTime()
          bValue = new Date(b.updatedAt).getTime()
          break
        case "createdAt":
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })
    return sorted
  }, [projects, sortField, sortDirection])

  // Paginate projects
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sortedProjects.slice(startIndex, endIndex)
  }, [sortedProjects, currentPage])

  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage)

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete project")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })

  const statusColors: Record<string, string> = {
    active: "bg-green-500/10 text-green-500",
    paused: "bg-yellow-500/10 text-yellow-500",
    completed: "bg-gray-500/10 text-gray-500",
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
    <PageContainer>
      <PageHeader
        title="Projects"
        description="Manage your development projects"
      >
        <ViewModeToggle
          viewMode={viewMode}
          onViewModeChange={(mode) => setViewMode(mode as ViewMode)}
          gridIcon={<Grid3x3 className="h-4 w-4" />}
          listIcon={<List className="h-4 w-4" />}
        />
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          New Project
        </Button>
      </PageHeader>

      {viewMode === "grid" ? (
        projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No projects yet</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const techStack = JSON.parse(project.techStack || "[]")
              return (
                <Card key={project.id} className="group transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 border-0 bg-gradient-to-br from-card to-card/95">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl font-mono break-all group-hover:text-primary transition-colors">{project.title}</CardTitle>
                        <CardDescription className="mt-2 text-sm leading-relaxed">
                          {project.description || "No description provided"}
                        </CardDescription>
                      </div>
                      <Badge
                        className={`${
                          statusColors[project.status] || statusColors.active
                        } shrink-0 font-medium px-2 py-1`}
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {techStack.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-foreground">Tech Stack</h4>
                        <div className="flex flex-wrap gap-2">
                          {techStack.slice(0, 6).map((tech: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs px-2 py-1 font-medium bg-primary/10 text-primary border-primary/20">
                              {tech}
                            </Badge>
                          ))}
                          {techStack.length > 6 && (
                            <Badge variant="secondary" className="text-xs px-2 py-1 bg-muted">
                              +{techStack.length - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Updated</span>
                        <span className="font-medium">{formatDate(project.updatedAt)}</span>
                      </div>
                      {project.githubRepo && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Repository</span>
                          <a
                            href={project.githubRepo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-primary transition-colors font-medium"
                          >
                            View on GitHub <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="font-medium"
                        asChild
                      >
                        <a href={`/projects/${project.id}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-medium"
                        onClick={() => setEditingProject(project)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-medium hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to delete this project?"
                            )
                          ) {
                            deleteMutation.mutate(project.id)
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
                <CardTitle>Projects ({projects.length})</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Showing {paginatedProjects.length} of {projects.length}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("title")}
                    >
                      <div className="flex items-center">
                        Title
                        <SortIcon field="title" />
                      </div>
                    </TableHead>
                    <TableHead>Tech Stack</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("deployment")}
                    >
                      <div className="flex items-center">
                        Deployment
                        <SortIcon field="deployment" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center">
                        Status
                        <SortIcon field="status" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("updatedAt")}
                    >
                      <div className="flex items-center">
                        Updated
                        <SortIcon field="updatedAt" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <p className="text-muted-foreground">No projects found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProjects.map((project) => {
                      const techStack = JSON.parse(project.techStack || "[]")
                      return (
                        <TableRow key={project.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{project.title}</TableCell>
                          <TableCell>
                            {techStack.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {techStack.slice(0, 3).map((tech: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {tech}
                                  </Badge>
                                ))}
                                {techStack.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{techStack.length - 3}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{project.deployment}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                statusColors[project.status] || statusColors.active
                              }
                            >
                              {project.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {formatDate(project.updatedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {project.githubRepo && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                >
                                  <a
                                    href={project.githubRepo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <a
                                  href={`/projects/${project.id}`}
                                  className="flex items-center"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  <span className="sr-only">View Project</span>
                                </a>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingProject(project)}
                              >
                                <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span className="sr-only">Edit Project</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Are you sure you want to delete this project?"
                                    )
                                  ) {
                                    deleteMutation.mutate(project.id)
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                                <span className="sr-only">Delete Project</span>
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

      <CreateProjectDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      {editingProject && (
        <EditProjectDialog
          project={editingProject}
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
        />
      )}
    </PageContainer>
  )
}
