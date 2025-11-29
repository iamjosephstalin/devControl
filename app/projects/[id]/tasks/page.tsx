"use client"

import { useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreateTaskDialog } from "@/components/tasks/create-dialog"
import { useState } from "react"
import { Plus, Calendar, AlertCircle } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function ProjectTasksPage() {
  const params = useParams()
  const projectId = params.id as string
  const queryClient = useQueryClient()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) throw new Error("Failed to fetch project")
      return res.json()
    },
  })

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?projectId=${projectId}`)
      if (!res.ok) throw new Error("Failed to fetch tasks")
      return res.json()
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Failed to update task")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
    },
  })

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateTaskMutation.mutate({ id: taskId, status: newStatus })
  }

  const statusColors = {
    backlog: "bg-gray-500",
    in_progress: "bg-blue-500",
    completed: "bg-green-500",
  }

  const priorityColors = {
    low: "bg-gray-500",
    medium: "bg-yellow-500",
    high: "bg-red-500",
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-mono tracking-tight">
          {project?.title || "Project"} - Tasks
        </h1>
        <p className="text-muted-foreground">
          Manage tasks for this project
        </p>
      </div>

      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Task
        </Button>
      </div>

      {isLoading ? (
        <p>Loading tasks...</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {["backlog", "in_progress", "completed"].map((status) => {
            const statusTasks = tasks?.filter((t: any) => t.status === status) || []
            return (
              <Card key={status}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${statusColors[status as keyof typeof statusColors]}`} />
                    {status.replace("_", " ").toUpperCase()}
                  </CardTitle>
                  <CardDescription>
                    {statusTasks.length} task{statusTasks.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {statusTasks.map((task: any) => (
                    <div
                      key={task.id}
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => {
                        const nextStatus =
                          status === "backlog"
                            ? "in_progress"
                            : status === "in_progress"
                              ? "completed"
                              : "backlog"
                        handleStatusChange(task.id, nextStatus)
                      }}
                    >
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <h4 className="font-medium break-all">{task.title}</h4>
                        <Badge
                          className={priorityColors[task.priority as keyof typeof priorityColors]}
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {task.description}
                        </p>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(task.dueDate)}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        defaultProjectId={projectId}
      />
    </div>
  )
}

