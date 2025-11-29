"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  FolderKanban,
  CheckSquare,
  Server,
  Key,
  AlertCircle,
  ArrowRight,
  Calendar,
  TrendingUp,
} from "lucide-react"
import { formatDate } from "@/lib/utils"

interface DashboardOverviewProps {
  projects: any[]
  tasks: any[]
  todayTasks: any[]
  highPriorityTasks: any[]
  activeProjects: any[]
  servers: any[]
  secrets: any[]
}

export function DashboardOverview({
  projects,
  tasks,
  todayTasks,
  highPriorityTasks,
  activeProjects,
  servers,
  secrets,
}: DashboardOverviewProps) {
  const statusColors: Record<string, string> = {
    active: "bg-green-500/10 text-green-500",
    paused: "bg-yellow-500/10 text-yellow-500",
    completed: "bg-gray-500/10 text-gray-500",
  }

  const priorityColors: Record<string, string> = {
    high: "bg-red-500/10 text-red-500",
    medium: "bg-yellow-500/10 text-yellow-500",
    low: "bg-blue-500/10 text-blue-500",
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{activeProjects.length}</div>
            <p className="text-xs text-muted-foreground font-mono">
              {projects.length} total projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{todayTasks.length}</div>
            <p className="text-xs text-muted-foreground font-mono">
              {highPriorityTasks.length} high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servers</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{servers.length}</div>
            <p className="text-xs text-muted-foreground font-mono">Managed servers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Secrets</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{secrets.length}</div>
            <p className="text-xs text-muted-foreground font-mono">Encrypted secrets</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Highlights */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Today's Tasks
            </CardTitle>
            <CardDescription>Tasks due today</CardDescription>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks due today</p>
            ) : (
              <div className="space-y-2">
                {todayTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      {task.projectId && (
                        <p className="text-xs text-muted-foreground">
                          Project task
                        </p>
                      )}
                    </div>
                    <Badge
                      className={priorityColors[task.priority] || priorityColors.medium}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href="/tasks">
                View All Tasks <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              High Priority
            </CardTitle>
            <CardDescription>Urgent tasks requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            {highPriorityTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No high priority tasks
              </p>
            ) : (
              <div className="space-y-2">
                {highPriorityTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          Due: {formatDate(task.dueDate)}
                        </p>
                      )}
                    </div>
                    <Badge variant="destructive">High</Badge>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href="/tasks">
                View All Tasks <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>Your most recently updated projects</CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet</p>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold font-mono">{project.title}</h3>
                      <Badge
                        className={
                          statusColors[project.status] || statusColors.active
                        }
                      >
                        {project.status}
                      </Badge>
                    </div>
                    {project.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {project.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Updated {formatDate(project.updatedAt)}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/projects/${project.id}`}>
                      View <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" className="mt-4 w-full" asChild>
            <Link href="/projects">
              View All Projects <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

