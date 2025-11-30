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
              Today&apos;s Tasks
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

      {/* All Projects */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight font-mono">All Projects</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            let techStack = []
            try {
              techStack = JSON.parse(project.techStack || "[]")
            } catch (e) {
              techStack = project.techStack ? project.techStack.split(",") : []
            }

            let tags = []
            try {
              tags = JSON.parse(project.tags || "[]")
            } catch (e) {
              tags = project.tags ? project.tags.split(",") : []
            }

            const nextTask = project.tasks?.[0]

            return (
              <Card key={project.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg font-mono truncate" title={project.title}>
                      {project.title}
                    </CardTitle>
                    <Badge className={statusColors[project.status] || statusColors.active}>
                      {project.status}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                    {project.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  {/* Tech Stack & Tags */}
                  <div className="flex flex-wrap gap-1">
                    {techStack.slice(0, 3).map((tech: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {tags.slice(0, 2).map((tag: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-foreground">Deployment</span>
                      <span className="capitalize">{project.deployment}</span>
                      {project.deploymentUrl && (
                        <a
                          href={project.deploymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-500 hover:underline truncate max-w-[100px]"
                        >
                          {project.deploymentUrl.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-foreground">Repo</span>
                      {project.githubRepo ? (
                        <a
                          href={project.githubRepo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline hover:text-primary truncate"
                        >
                          {project.githubRepo.replace("https://github.com/", "")}
                        </a>
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-foreground">Last Commit</span>
                      <span>{project.lastCommit ? formatDate(project.lastCommit) : "-"}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-foreground">Last Deploy</span>
                      <span>{project.lastDeployment ? formatDate(project.lastDeployment) : "-"}</span>
                    </div>
                  </div>

                  {/* Next Task */}
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Next Task</p>
                    {nextTask ? (
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm truncate" title={nextTask.title}>{nextTask.title}</span>
                        <Badge className={priorityColors[nextTask.priority] || priorityColors.medium + " text-[10px] px-1 py-0 h-5"}>
                          {nextTask.priority}
                        </Badge>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No open tasks</p>
                    )}
                  </div>
                </CardContent>
                <div className="p-6 pt-0 mt-auto">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/projects/${project.id}`}>
                      View Project
                    </Link>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

