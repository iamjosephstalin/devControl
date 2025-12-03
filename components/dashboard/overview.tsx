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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight font-mono">All Projects</h2>
          <Badge variant="secondary" className="font-mono">
            {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
          </Badge>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
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
              <Card key={project.id} className="group flex flex-col transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 border-0 bg-gradient-to-br from-card to-card/95">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl font-mono truncate group-hover:text-primary transition-colors" title={project.title}>
                        {project.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 min-h-[2.5rem] mt-2 text-sm leading-relaxed">
                        {project.description || "No description provided"}
                      </CardDescription>
                    </div>
                    <Badge className={`${statusColors[project.status] || statusColors.active} shrink-0 font-medium`}>
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-5">
                  {/* Tech Stack & Tags */}
                  <div className="space-y-3">
                    {techStack.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {techStack.slice(0, 4).map((tech: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs px-2 py-1 font-medium bg-primary/10 text-primary border-primary/20">
                            {tech}
                          </Badge>
                        ))}
                        {techStack.length > 4 && (
                          <Badge variant="secondary" className="text-xs px-2 py-1 bg-muted">
                            +{techStack.length - 4} more
                          </Badge>
                        )}
                      </div>
                    )}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.slice(0, 3).map((tag: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs px-2 py-1 font-medium">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Key Metrics */}
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Project Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <span className="text-muted-foreground">Deployment</span>
                        <div className="space-y-1">
                          <p className="capitalize font-medium">{project.deployment}</p>
                          {project.deploymentUrl && (
                            <a
                              href={project.deploymentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:text-blue-600 hover:underline truncate block transition-colors"
                            >
                              {project.deploymentUrl.replace(/^https?:\/\//, "")}
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground">Repository</span>
                        {project.githubRepo ? (
                          <a
                            href={project.githubRepo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block font-medium hover:text-primary transition-colors truncate"
                            title={project.githubRepo}
                          >
                            {project.githubRepo.replace("https://github.com/", "")}
                          </a>
                        ) : (
                          <p className="text-muted-foreground font-medium">No repository</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
                      <div className="space-y-1">
                        <span className="text-muted-foreground">Last Commit</span>
                        <p className="font-medium">{project.lastCommit ? formatDate(project.lastCommit) : "No commits"}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground">Last Deploy</span>
                        <p className="font-medium">{project.lastDeployment ? formatDate(project.lastDeployment) : "Not deployed"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Next Task */}
                  <div className="rounded-lg border bg-gradient-to-r from-muted/50 to-muted/30 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-foreground">Next Task</h4>
                      {nextTask && (
                        <Badge className={`${priorityColors[nextTask.priority] || priorityColors.medium} text-xs px-2 py-1 font-medium`}>
                          {nextTask.priority}
                        </Badge>
                      )}
                    </div>
                    {nextTask ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium leading-relaxed" title={nextTask.title}>
                          {nextTask.title}
                        </p>
                        {nextTask.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {nextTask.description}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground font-medium">
                        🎉 All tasks completed!
                      </p>
                    )}
                  </div>
                </CardContent>
                <div className="p-6 pt-0 mt-auto">
                  <Button className="w-full font-medium group-hover:bg-primary/90 transition-colors" asChild>
                    <Link href={`/projects/${project.id}`}>
                      View Project Details
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
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

