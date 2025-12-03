"use client"

import { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
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
import { Badge } from "@/components/ui/badge"
import { Users, X } from "lucide-react"

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
    const { data: session } = useSession()
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
    const [selectedClients, setSelectedClients] = useState<string[]>([])
    const [initialClients, setInitialClients] = useState<string[]>([])

    // Fetch users (clients) for assignment - only for admins
    const { data: users = [] } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await fetch("/api/users")
            if (!res.ok) throw new Error("Failed to fetch users")
            return res.json()
        },
        enabled: session?.user?.role === "admin" && open
    })

    // Fetch current project assignments
    const { data: projectAssignments = [] } = useQuery({
        queryKey: ["project-assignments", project.id],
        queryFn: async () => {
            const res = await fetch(`/api/project-assignments?projectId=${project.id}`)
            if (!res.ok) throw new Error("Failed to fetch project assignments")
            return res.json()
        },
        enabled: session?.user?.role === "admin" && open
    })

    const clientUsers = users.filter((user: any) => user.role === "client")
    
    // Load current assignments when dialog opens
    useEffect(() => {
        if (projectAssignments.length > 0) {
            const assignedClientIds = projectAssignments.map((assignment: any) => assignment.userId)
            setSelectedClients(assignedClientIds)
            setInitialClients(assignedClientIds)
        }
    }, [projectAssignments])

    // Helper functions for client management
    const toggleClientSelection = (clientId: string) => {
        setSelectedClients(prev => 
            prev.includes(clientId)
                ? prev.filter(id => id !== clientId)
                : [...prev, clientId]
        )
    }

    const removeClient = (clientId: string) => {
        setSelectedClients(prev => prev.filter(id => id !== clientId))
    }

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
        onSuccess: async () => {
            // Update client assignments if they changed
            if (session?.user?.role === "admin") {
                const clientsToAdd = selectedClients.filter(id => !initialClients.includes(id))
                const clientsToRemove = initialClients.filter(id => !selectedClients.includes(id))
                
                // Remove unassigned clients
                await Promise.all(
                    clientsToRemove.map(async (clientId) => {
                        const assignment = projectAssignments.find((a: any) => a.userId === clientId)
                        if (assignment) {
                            await fetch(`/api/project-assignments?id=${assignment.id}`, {
                                method: "DELETE"
                            })
                        }
                    })
                )
                
                // Add new client assignments
                await Promise.all(
                    clientsToAdd.map(async (clientId) => {
                        await fetch("/api/project-assignments", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                projectId: project.id,
                                userId: clientId
                            }),
                        })
                    })
                )
            }

            queryClient.invalidateQueries({ queryKey: ["projects"] })
            queryClient.invalidateQueries({ queryKey: ["project", project.id] })
            queryClient.invalidateQueries({ queryKey: ["project-assignments"] })
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

                    {/* Client Assignment - Only for Admins */}
                    {session?.user?.role === "admin" && (
                        <div>
                            <Label className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Assigned Clients
                            </Label>
                            <div className="space-y-3">
                                <Select onValueChange={toggleClientSelection}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Add or remove clients from this project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clientUsers.map((client: any) => (
                                            <SelectItem 
                                                key={client.id} 
                                                value={client.id}
                                                disabled={selectedClients.includes(client.id)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span>{client.name || client.email}</span>
                                                    <span className="text-xs text-muted-foreground">({client.email})</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {selectedClients.length > 0 ? (
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium">Assigned Clients ({selectedClients.length}):</div>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedClients.map((clientId) => {
                                                const client = clientUsers.find((u: any) => u.id === clientId)
                                                const isNewAssignment = !initialClients.includes(clientId)
                                                return (
                                                    <Badge 
                                                        key={clientId} 
                                                        variant={isNewAssignment ? "default" : "secondary"} 
                                                        className="flex items-center gap-1"
                                                    >
                                                        {client?.name || client?.email}
                                                        {isNewAssignment && <span className="text-xs">(new)</span>}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeClient(clientId)}
                                                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground">
                                        No clients assigned to this project
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
