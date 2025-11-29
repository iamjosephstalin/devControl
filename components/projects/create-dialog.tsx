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

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
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

