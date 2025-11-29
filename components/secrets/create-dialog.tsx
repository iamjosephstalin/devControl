"use client"

import { useState } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
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

interface CreateSecretDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateSecretDialog({
  open,
  onOpenChange,
}: CreateSecretDialogProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: "",
    type: "api_key",
    value: "",
    description: "",
    projectId: "none",
  })

  // Fetch projects for the dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          projectId: data.projectId === "none" ? null : data.projectId,
        }),
      })
      if (!res.ok) throw new Error("Failed to create secret")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secrets"] })
      setFormData({
        name: "",
        type: "api_key",
        value: "",
        description: "",
        projectId: "none",
      })
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Secret</DialogTitle>
          <DialogDescription>
            Add a new encrypted secret to your vault
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Secret name"
            />
          </div>
          <div>
            <Label htmlFor="type">Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="api_key">API Key</SelectItem>
                <SelectItem value="ssh">SSH Key</SelectItem>
                <SelectItem value="password">Password</SelectItem>
                <SelectItem value="env_var">Environment Variable</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="value">Value *</Label>
            <Input
              id="value"
              type="password"
              value={formData.value}
              onChange={(e) =>
                setFormData({ ...formData, value: e.target.value })
              }
              placeholder="Secret value"
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
              placeholder="Optional description"
            />
          </div>
          <div>
            <Label htmlFor="projectId">Project (optional)</Label>
            <Select
              value={formData.projectId}
              onValueChange={(value) =>
                setFormData({ ...formData, projectId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="General (no project)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General</SelectItem>
                {projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={createMutation.isPending || !formData.name || !formData.value}
            >
              {createMutation.isPending ? "Creating..." : "Create Secret"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

