import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { ArrowLeft, ExternalLink, Github, Calendar, Server, Key, FileText, CheckSquare, Edit } from "lucide-react"
import { ProjectHeader } from "@/components/projects/project-header"

export default async function ProjectDetailsPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return redirect("/login")

    const project: any = await prisma.project.findUnique({
        where: {
            id: params.id,
            userId: session.user.id
        },
        include: {
            tasks: {
                orderBy: { updatedAt: "desc" },
                take: 5
            },
            servers: true,
            secrets: true,
            notes: {
                orderBy: { updatedAt: "desc" },
                take: 5
            }
        }
    })

    if (!project) {
        notFound()
    }



    const priorityColors: Record<string, string> = {
        high: "bg-red-500/10 text-red-500",
        medium: "bg-yellow-500/10 text-yellow-500",
        low: "bg-blue-500/10 text-blue-500",
    }

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

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <ProjectHeader project={project} />

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Info Column */}
                <div className="md:col-span-2 space-y-6">
                    {/* Overview Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">Deployment Target</span>
                                    <div className="flex items-center gap-2">
                                        <Server className="h-4 w-4 text-muted-foreground" />
                                        <span className="capitalize">{project.deployment}</span>
                                    </div>
                                    {project.deploymentUrl && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                            <a
                                                href={project.deploymentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-500 hover:underline truncate max-w-[150px]"
                                            >
                                                {project.deploymentUrl}
                                            </a>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>{formatDate(project.updatedAt)}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">Last Commit</span>
                                    <div className="flex items-center gap-2">
                                        <Github className="h-4 w-4 text-muted-foreground" />
                                        <span>{project.lastCommit ? formatDate(project.lastCommit) : "-"}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">Last Deployment</span>
                                    <div className="flex items-center gap-2">
                                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                        <span>{project.lastDeployment ? formatDate(project.lastDeployment) : "-"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="text-sm font-medium text-muted-foreground">Tech Stack</span>
                                <div className="flex flex-wrap gap-2">
                                    {techStack.map((tech: string, i: number) => (
                                        <Badge key={i} variant="secondary">
                                            {tech}
                                        </Badge>
                                    ))}
                                    {techStack.length === 0 && <span className="text-sm text-muted-foreground">-</span>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="text-sm font-medium text-muted-foreground">Tags</span>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag: string, i: number) => (
                                        <Badge key={i} variant="outline">
                                            {tag}
                                        </Badge>
                                    ))}
                                    {tags.length === 0 && <span className="text-sm text-muted-foreground">-</span>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Tasks */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <CheckSquare className="h-5 w-5" />
                                Recent Tasks
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={`/projects/${project.id}/tasks`}>
                                    View All
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {project.tasks.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No tasks created yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {project.tasks.map((task: any) => (
                                        <div key={task.id} className="flex items-center justify-between p-2 rounded-lg border bg-card/50">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' :
                                                    task.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
                                                    }`} />
                                                <span className={task.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                                                    {task.title}
                                                </span>
                                            </div>
                                            <Badge className={priorityColors[task.priority] || priorityColors.medium}>
                                                {task.priority}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Infrastructure */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Server className="h-5 w-5" />
                                Infrastructure
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {project.servers.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No servers linked</p>
                            ) : (
                                <div className="space-y-2">
                                    {project.servers.map((server: any) => (
                                        <div key={server.id} className="flex items-center justify-between text-sm">
                                            <span>{server.name}</span>
                                            <Badge variant="outline">{server.provider}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Button variant="outline" className="w-full mt-4" asChild>
                                <Link href="/infrastructure">Manage Servers</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Secrets */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Key className="h-5 w-5" />
                                Secrets
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {project.secrets.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No secrets linked</p>
                            ) : (
                                <div className="space-y-2">
                                    {project.secrets.map((secret: any) => (
                                        <div key={secret.id} className="flex items-center justify-between text-sm">
                                            <span>{secret.name}</span>
                                            <Badge variant="secondary" className="text-xs">{secret.type}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Button variant="outline" className="w-full mt-4" asChild>
                                <Link href="/secrets">Manage Secrets</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Recent Notes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileText className="h-5 w-5" />
                                Notes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {project.notes.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No notes added</p>
                            ) : (
                                <div className="space-y-2">
                                    {project.notes.map((note: any) => (
                                        <Link
                                            key={note.id}
                                            href={`/notes?id=${note.id}`}
                                            className="block p-2 rounded-md hover:bg-muted transition-colors"
                                        >
                                            <p className="text-sm font-medium truncate">{note.title}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {formatDate(note.updatedAt)}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            )}
                            <Button variant="outline" className="w-full mt-4" asChild>
                                <Link href="/notes">View Notes</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
