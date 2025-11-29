"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Github, Edit, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EditProjectDialog } from "@/components/projects/edit-dialog"
import { useMutation, useQueryClient } from "@tanstack/react-query"

interface ProjectHeaderProps {
    project: any
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
    const [isEditOpen, setIsEditOpen] = useState(false)
    const queryClient = useQueryClient()

    const statusColors: Record<string, string> = {
        active: "bg-green-500/10 text-green-500",
        paused: "bg-yellow-500/10 text-yellow-500",
        completed: "bg-gray-500/10 text-gray-500",
    }

    const syncMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/projects/${project.id}/sync`, {
                method: "POST",
            })
            if (!res.ok) throw new Error("Failed to sync project")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project", project.id] })
        },
        onError: () => {
            console.error("Sync Failed")
        },
    })

    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Link href="/projects" className="hover:text-foreground transition-colors flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" /> Back to Projects
                    </Link>
                </div>
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold font-mono tracking-tight">{project.title}</h1>
                    <Badge className={statusColors[project.status] || statusColors.active}>
                        {project.status}
                    </Badge>
                </div>
                <p className="text-muted-foreground max-w-2xl">
                    {project.description || "No description provided"}
                </p>
            </div>
            <div className="flex items-center gap-2">
                {project.githubRepo && (
                    <>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => syncMutation.mutate()}
                            disabled={syncMutation.isPending}
                            title="Sync with GitHub"
                        >
                            <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                        </Button>
                        <Button variant="outline" asChild>
                            <a href={project.githubRepo} target="_blank" rel="noopener noreferrer">
                                <Github className="mr-2 h-4 w-4" />
                                Repository
                            </a>
                        </Button>
                    </>
                )}
                <Button onClick={() => setIsEditOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Project
                </Button>
            </div>

            <EditProjectDialog
                project={project}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
            />
        </div>
    )
}
