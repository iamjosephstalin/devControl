import { useState, useEffect, useRef } from "react"
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
import { Shield, Upload } from "lucide-react"

interface CreateNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  note?: any
}

export function CreateNoteDialog({
  open,
  onOpenChange,
  note,
}: CreateNoteDialogProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    title: note?.title || "",
    content: note?.content || "",
    tags: note?.tags ? JSON.parse(note.tags).join(", ") : "",
    projectId: note?.project?.id || "none",
    isEncrypted: note?.isEncrypted || false,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset form when opening/closing or changing note
  useEffect(() => {
    if (open) {
      setFormData({
        title: note?.title || "",
        content: note?.content || "",
        tags: note?.tags ? JSON.parse(note.tags).join(", ") : "",
        projectId: note?.project?.id || "none",
        isEncrypted: note?.isEncrypted || false,
      })
    }
  }, [open, note])

  // Fetch projects for the dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json()
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = note ? `/api/notes/${note.id}` : "/api/notes"
      const method = note ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
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
      if (!res.ok) throw new Error(`Failed to ${note ? "update" : "create"} note`)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] })
      if (!note) {
        setFormData({
          title: "",
          content: "",
          tags: "",
          projectId: "none",
          isEncrypted: false,
        })
      }
      onOpenChange(false)
    },
  })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const fileName = file.name.replace(/\.(md|txt)$/i, "")
      setFormData((prev) => ({
        ...prev,
        content: text,
        title: prev.title || fileName, // Only set title if it's empty
      }))
    }
    reader.readAsText(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{note ? "Edit Note" : "Create New Note"}</DialogTitle>
          <DialogDescription>
            {note ? "Update your existing note" : "Add a new note to your knowledge base"}
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

          <div className="flex items-center space-x-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <input
              type="checkbox"
              id="isEncrypted"
              checked={formData.isEncrypted}
              onChange={(e) =>
                setFormData({ ...formData, isEncrypted: e.target.checked })
              }
              className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-amber-300 rounded"
            />
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <Label
                htmlFor="isEncrypted"
                className="text-sm font-medium text-amber-800 dark:text-amber-200 cursor-pointer"
              >
                Encrypt this note
              </Label>
            </div>
          </div>
          {formData.isEncrypted && (
            <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200 dark:border-amber-800">
              <strong>Note:</strong> Encrypted notes will have their title and content encrypted using AES-256 encryption.
              The title will be partially visible for identification purposes.
            </div>
          )}

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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".md,.txt"
                />
              </div>
            </div>

            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="# Heading&#10;&#10;Your markdown content here..."
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => mutation.mutate(formData)}
              disabled={mutation.isPending || !formData.title || !formData.content}
            >
              {mutation.isPending ? (note ? "Updating..." : "Creating...") : (note ? "Update Note" : "Create Note")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
