"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import {
  Plus,
  Calendar,
  Filter,
  Grid3x3,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
} from "lucide-react"
import { CreateTaskDialog } from "@/components/tasks/create-dialog"
import { formatDate } from "@/lib/utils"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Task {
  id: string
  title: string
  description: string | null
  status: "backlog" | "in_progress" | "completed"
  priority: "low" | "medium" | "high"
  dueDate: string | null
  project: {
    id: string
    title: string
  } | null
}

const statusColumns = [
  { id: "backlog", title: "Backlog" },
  { id: "in_progress", title: "In Progress" },
  { id: "completed", title: "Completed" },
]

const priorityColors: Record<string, string> = {
  high: "bg-red-500/10 text-red-500",
  medium: "bg-yellow-500/10 text-yellow-500",
  low: "bg-blue-500/10 text-blue-500",
}

type ViewMode = "kanban" | "list"
type SortField = "title" | "priority" | "dueDate" | "status" | "project"
type SortDirection = "asc" | "desc"

export default function TasksPage() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("kanban")
  const [sortField, setSortField] = useState<SortField>("dueDate")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
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

  const { data: allTasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks")
      if (!res.ok) throw new Error("Failed to fetch tasks")
      return res.json()
    },
  })

  // Filter tasks based on selected project
  const filteredTasks = useMemo(() => {
    if (selectedProjectId === "all") return allTasks
    if (selectedProjectId === "general") {
      return allTasks.filter((t) => !t.project)
    }
    return allTasks.filter((t) => t.project?.id === selectedProjectId)
  }, [allTasks, selectedProjectId])

  // Sort tasks
  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks]
    sorted.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case "title":
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          aValue = priorityOrder[a.priority] || 0
          bValue = priorityOrder[b.priority] || 0
          break
        case "dueDate":
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0
          break
        case "status":
          const statusOrder = { completed: 3, in_progress: 2, backlog: 1 }
          aValue = statusOrder[a.status] || 0
          bValue = statusOrder[b.status] || 0
          break
        case "project":
          aValue = a.project?.title || ""
          bValue = b.project?.title || ""
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredTasks, sortField, sortDirection])

  // Paginate tasks
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sortedTasks.slice(startIndex, endIndex)
  }, [sortedTasks, currentPage])

  const totalPages = Math.ceil(sortedTasks.length / itemsPerPage)

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Failed to update task")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete task")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const taskId = result.draggableId
    const newStatus = result.destination.droppableId as Task["status"]
    updateMutation.mutate({ id: taskId, status: newStatus })
  }

  const tasksByStatus = {
    backlog: filteredTasks.filter((t) => t.status === "backlog"),
    in_progress: filteredTasks.filter((t) => t.status === "in_progress"),
    completed: filteredTasks.filter((t) => t.status === "completed"),
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
          <h1 className="text-3xl font-bold font-mono tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage your tasks with Kanban board or list view
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
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
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
            New Task
          </Button>
        </div>
      </div>

      {viewMode === "kanban" ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {statusColumns.map((column) => (
              <div key={column.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold font-mono">{column.title}</h2>
                  <Badge variant="outline">
                    {tasksByStatus[column.id as keyof typeof tasksByStatus].length}
                  </Badge>
                </div>
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] space-y-2 rounded-lg border-2 p-4 transition-colors ${
                        snapshot.isDraggingOver
                          ? "border-primary bg-primary/5"
                          : "border-dashed"
                      }`}
                    >
                      {tasksByStatus[column.id as keyof typeof tasksByStatus].map(
                        (task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`cursor-move ${
                                  snapshot.isDragging ? "shadow-lg" : ""
                                }`}
                              >
                                <CardContent className="p-4">
                                  <div className="space-y-2">
                                    <h3 className="font-medium font-mono">{task.title}</h3>
                                    {task.description && (
                                      <p className="text-sm text-muted-foreground">
                                        {task.description}
                                      </p>
                                    )}
                                    <div className="flex items-center justify-between">
                                      <Badge
                                        className={
                                          priorityColors[task.priority] ||
                                          priorityColors.medium
                                        }
                                      >
                                        {task.priority}
                                      </Badge>
                                      {task.dueDate && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Calendar className="h-3 w-3" />
                                          {formatDate(task.dueDate)}
                                        </div>
                                      )}
                                    </div>
                                    {task.project && (
                                      <Badge variant="outline" className="text-xs">
                                        {task.project.title}
                                      </Badge>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        )
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      ) : (
        <div className="space-y-4">
          <Card>
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
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("project")}
                    >
                      <div className="flex items-center">
                        Project
                        <SortIcon field="project" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("priority")}
                    >
                      <div className="flex items-center">
                        Priority
                        <SortIcon field="priority" />
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
                      onClick={() => handleSort("dueDate")}
                    >
                      <div className="flex items-center">
                        Due Date
                        <SortIcon field="dueDate" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <p className="text-muted-foreground">No tasks found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTasks.map((task) => (
                      <TableRow key={task.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell>
                          {task.project ? (
                            <Badge variant="secondary">{task.project.title}</Badge>
                          ) : (
                            <Badge variant="outline">General</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              priorityColors[task.priority] || priorityColors.medium
                            }
                          >
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{task.status}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {task.dueDate ? formatDate(task.dueDate) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newStatus =
                                  task.status === "backlog"
                                    ? "in_progress"
                                    : task.status === "in_progress"
                                    ? "completed"
                                    : "backlog"
                                updateMutation.mutate({ id: task.id, status: newStatus })
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this task?")) {
                                  deleteMutation.mutate(task.id)
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
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

      <CreateTaskDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  )
}
