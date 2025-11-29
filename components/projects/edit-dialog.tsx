"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import { Button } from "@/components/ui/button"
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
    tags: string | null
}

interface EditProjectDialogProps {
    project: Project
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditProjectDialog({
    project,
    open,
    onOpenChange,
}: EditProjectDialogProps) {
    const queryClient = useQueryClient()
    const [formData, setFormData] = useState({
        title: project.title,
        description: project.description || "",
        techStack: JSON.parse(project.techStack || "[]").join(", "),
        githubRepo: project.githubRepo || "",
        deployment: project.deployment,
        deploymentUrl: (project as any).deploymentUrl || "",
        status: project.status,
        tags: JSON.parse(project.tags || "[]").join(", "),
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
                    tags: data.tags
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
            queryClient.invalidateQueries({ queryKey: ["project", project.id] })
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
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
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
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="techStack">Tech Stack</Label>
                            <Input
                                id="techStack"
                                value={formData.techStack}
                                onChange={(e) =>
                                    setFormData({ ...formData, techStack: e.target.value })
                                }
                                placeholder="React, TypeScript"
                            />
                        </div>
                        <div>
                            <Label htmlFor="tags">Tags</Label>
                            <Input
                                id="tags"
                                value={formData.tags}
                                onChange={(e) =>
                                    setFormData({ ...formData, tags: e.target.value })
                                }
                                placeholder="frontend, api"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="githubRepo">Repository URL</Label>
                            <Input
                                id="githubRepo"
                                value={formData.githubRepo}
                                onChange={(e) =>
                                    setFormData({ ...formData, githubRepo: e.target.value })
                                }
                                placeholder="https://github.com/..."
                            />
                        </div>
                        <div>
                            <Label htmlFor="deploymentUrl">Deployment URL</Label>
                            <Input
                                id="deploymentUrl"
                                value={(formData as any).deploymentUrl}
                                onChange={(e) =>
                                    setFormData({ ...formData, deploymentUrl: e.target.value } as any)
                                }
                                placeholder="https://app.vercel.app"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="deployment">Deployment Target</Label>
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
            </DialogContent >
        </Dialog >
    )
}
