"use client"

import { useState } from "react"
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

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    techStack: "",
    githubRepo: "",
    deployment: "local",
    deploymentUrl: "",
    status: "active",
    tags: "",
  })
  const [selectedClients, setSelectedClients] = useState<string[]>([])

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

  const clientUsers = users.filter((user: any) => user.role === "client")

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

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/projects", {
        method: "POST",
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
      if (!res.ok) throw new Error("Failed to create project")
      return res.json()
    },
    onSuccess: async (project) => {
      // Assign selected clients to the project
      if (selectedClients.length > 0) {
        await Promise.all(
          selectedClients.map(async (clientId) => {
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
      queryClient.invalidateQueries({ queryKey: ["project-assignments"] })
      setFormData({
        title: "",
        description: "",
        techStack: "",
        githubRepo: "",
        deployment: "local",
        deploymentUrl: "",
        status: "active",
        tags: "",
      })
      setSelectedClients([])
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new project to your workspace
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="My Awesome Project"
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
              placeholder="A brief description of your project"
            />
          </div>

          {/* Client Assignment - Only for Admins */}
          {session?.user?.role === "admin" && (
            <div>
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assign Clients
              </Label>
              <div className="space-y-3">
                <Select onValueChange={toggleClientSelection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select clients to assign to this project" />
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

                {selectedClients.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Selected Clients ({selectedClients.length}):</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedClients.map((clientId) => {
                        const client = clientUsers.find((u: any) => u.id === clientId)
                        return (
                          <Badge key={clientId} variant="secondary" className="flex items-center gap-1">
                            {client?.name || client?.email}
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
                value={formData.deploymentUrl}
                onChange={(e) =>
                  setFormData({ ...formData, deploymentUrl: e.target.value })
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
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createMutation.mutate(formData)}
            disabled={createMutation.isPending || !formData.title}
          >
            {createMutation.isPending ? "Creating..." : "Create Project"}
          </Button>
        </div>

      </DialogContent >
    </Dialog >
  )
}

