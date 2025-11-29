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

interface CreateNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateNoteDialog({
  open,
  onOpenChange,
}: CreateNoteDialogProps) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: "",
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
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          tags: data.tags
            .split(",")
            .map((t: string) => t.trim())
            .filter((t: string) => t),
          projectId: data.projectId === "none" ? null : data.projectId || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to create note")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] })
      setFormData({
        title: "",
        content: "",
        tags: "",
        projectId: "none",
      })
      setActiveTab("edit")
      onOpenChange(false)
    },
  })

  const templates = [
    {
      name: "Meeting Notes",
      content: "# Meeting Notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n- \n\n## Action Items\n- [ ] \n",
    },
    {
      name: "Bug Report",
      content: "# Bug Report\n\n**Severity:** High/Medium/Low\n\n## Description\n\n## Steps to Reproduce\n1. \n2. \n\n## Expected Behavior\n\n## Actual Behavior\n",
    },
    {
      name: "Feature Spec",
      content: "# Feature Specification\n\n## Overview\n\n## User Stories\n- As a user, I want to...\n\n## Technical Implementation\n",
    },
  ]

  const applyTemplate = (templateContent: string) => {
    setFormData({ ...formData, content: templateContent })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
          <DialogDescription>
            Add a new note to your knowledge base
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Note title"
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
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              placeholder="tag1, tag2, folder:work"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tip: Use <code>folder:name</code> to organize into folders.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Content (Markdown) *</Label>
              <div className="flex items-center gap-2">
                <Select onValueChange={applyTemplate}>
                  <SelectTrigger className="h-8 w-[150px]">
                    <SelectValue placeholder="Load Template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.name} value={t.content}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center border rounded-md overflow-hidden">
                  <button
                    className={`px-3 py-1 text-xs ${activeTab === "edit"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                      }`}
                    onClick={() => setActiveTab("edit")}
                  >
                    Edit
                  </button>
                  <button
                    className={`px-3 py-1 text-xs ${activeTab === "preview"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                      }`}
                    onClick={() => setActiveTab("preview")}
                  >
                    Preview
                  </button>
                </div>
              </div>
            </div>

            {activeTab === "edit" ? (
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="# Heading&#10;&#10;Your markdown content here..."
                className="min-h-[300px] font-mono text-sm"
              />
            ) : (
              <div className="min-h-[300px] border rounded-md p-4 prose prose-invert max-w-none overflow-y-auto bg-muted/30">
                {formData.content ? (
                  <div className="whitespace-pre-wrap">{formData.content}</div>
                ) : (
                  <p className="text-muted-foreground italic">Nothing to preview</p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={createMutation.isPending || !formData.title || !formData.content}
            >
              {createMutation.isPending ? "Creating..." : "Create Note"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

