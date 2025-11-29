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
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CreateServerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateServerDialog({
  open,
  onOpenChange,
}: CreateServerDialogProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: "",
    host: "",
    port: "22",
    username: "",
    password: "",
    sshKeyPath: "",
    provider: "other",
    region: "",
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
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          port: parseInt(data.port) || 22,
          password: data.password || null,
          sshKeyPath: data.sshKeyPath || null,
          region: data.region || null,
          projectId: data.projectId === "none" ? null : data.projectId || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to create server")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servers"] })
      setFormData({
        name: "",
        host: "",
        port: "22",
        username: "",
        password: "",
        sshKeyPath: "",
        provider: "other",
        region: "",
        projectId: "none",
      })
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Server</DialogTitle>
          <DialogDescription>
            Configure SSH access to your server
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Server Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Production Server"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="host">Host *</Label>
              <Input
                id="host"
                value={formData.host}
                onChange={(e) =>
                  setFormData({ ...formData, host: e.target.value })
                }
                placeholder="192.168.1.1 or example.com"
              />
            </div>
            <div>
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={formData.port}
                onChange={(e) =>
                  setFormData({ ...formData, port: e.target.value })
                }
                placeholder="22"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              placeholder="root"
            />
          </div>
          <div>
            <Label htmlFor="password">Password (or leave empty for SSH key)</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Leave empty if using SSH key"
            />
          </div>
          <div>
            <Label htmlFor="sshKeyPath">SSH Key Path (optional)</Label>
            <Input
              id="sshKeyPath"
              value={formData.sshKeyPath}
              onChange={(e) =>
                setFormData({ ...formData, sshKeyPath: e.target.value })
              }
              placeholder="/path/to/private/key"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={formData.provider}
                onValueChange={(value) =>
                  setFormData({ ...formData, provider: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hetzner">Hetzner</SelectItem>
                  <SelectItem value="aws">AWS</SelectItem>
                  <SelectItem value="digitalocean">DigitalOcean</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) =>
                  setFormData({ ...formData, region: e.target.value })
                }
                placeholder="us-east-1"
              />
            </div>
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
              disabled={createMutation.isPending || !formData.name || !formData.host || !formData.username}
            >
              {createMutation.isPending ? "Adding..." : "Add Server"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

