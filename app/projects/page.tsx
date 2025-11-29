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
import { formatDate } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
}

type ViewMode = "grid" | "list"
type SortField = "title" | "status" | "deployment" | "updatedAt" | "createdAt"
type SortDirection = "asc" | "desc"

export default function ProjectsPage() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
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
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your development projects
          </p>
        </div>
        <div className="flex items-center gap-4">
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
            New Project
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? (
        projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No projects yet</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const techStack = JSON.parse(project.techStack || "[]")
              return (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>{project.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {project.description || "No description"}
                        </CardDescription>
                      </div>
                      <Badge
                        className={
                          statusColors[project.status] || statusColors.active
                        }
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {techStack.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {techStack.map((tech: string, idx: number) => (
                            <Badge key={idx} variant="outline">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Updated {formatDate(project.updatedAt)}</span>
                        {project.githubRepo && (
                          <a
                            href={project.githubRepo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-foreground"
                          >
                            GitHub <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setEditingProject(project)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
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
                                onClick={() => setEditingProject(project)}
                              >
                                <Edit className="h-4 w-4" />
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
    </div>
  )
}

function EditProjectDialog({
  project,
  open,
  onOpenChange,
}: {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    title: project.title,
    description: project.description || "",
    techStack: JSON.parse(project.techStack || "[]").join(", "),
    githubRepo: project.githubRepo || "",
    deployment: project.deployment,
    status: project.status,
  })

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          techStack: data.techStack
            .split(",")
            .map((t: string) => t.trim())
            .filter((t: string) => t),
        }),
      })
      if (!res.ok) throw new Error("Failed to update project")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update your project details
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="techStack">Tech Stack (comma-separated)</Label>
            <Input
              id="techStack"
              value={formData.techStack}
              onChange={(e) =>
                setFormData({ ...formData, techStack: e.target.value })
              }
              placeholder="React, TypeScript, Next.js"
            />
          </div>
          <div>
            <Label htmlFor="githubRepo">GitHub Repository URL</Label>
            <Input
              id="githubRepo"
              value={formData.githubRepo}
              onChange={(e) =>
                setFormData({ ...formData, githubRepo: e.target.value })
              }
              placeholder="https://github.com/username/repo"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deployment">Deployment</Label>
              <Select
                value={formData.deployment}
                onValueChange={(value) =>
                  setFormData({ ...formData, deployment: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vercel">Vercel</SelectItem>
                  <SelectItem value="hetzner">Hetzner</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateMutation.mutate(formData)}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
