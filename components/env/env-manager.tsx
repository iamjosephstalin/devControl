"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FileText, Loader2 } from "lucide-react"
import { EnvEditor } from "./env-editor"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface EnvManagerProps {
    projectId: string
}

export function EnvManager({ projectId }: EnvManagerProps) {
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newFileName, setNewFileName] = useState(".env")
    const queryClient = useQueryClient()

    const { data: envFiles = [], isLoading: isLoadingFiles } = useQuery({
        queryKey: ["env-files", projectId],
        queryFn: async () => {
            const res = await fetch(`/api/projects/${projectId}/env`)
            if (!res.ok) throw new Error("Failed to fetch env files")
            return res.json()
        },
    })

    const { data: servers = [] } = useQuery({
        queryKey: ["servers", projectId],
        queryFn: async () => {
            const res = await fetch(`/api/servers?projectId=${projectId}`)
            if (!res.ok) throw new Error("Failed to fetch servers")
            return res.json()
        },
    })

    const createMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/projects/${projectId}/env`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newFileName, content: "" }),
            })
            if (!res.ok) throw new Error("Failed to create env file")
            return res.json()
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["env-files", projectId] })
            setIsCreateOpen(false)
            setSelectedFileId(data.id)
            setNewFileName(".env")
            toast.success("Environment file created")
        },
        onError: () => {
            toast.error("Failed to create environment file")
        }
    })

    const selectedFile = envFiles.find((f: any) => f.id === selectedFileId)

    if (isLoadingFiles) {
        return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    }

    return (
        <div className="grid grid-cols-12 gap-6 h-[600px]">
            <div className="col-span-3 border-r pr-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium">Files</h3>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>New Environment File</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div>
                                    <Label>Filename</Label>
                                    <Input
                                        value={newFileName}
                                        onChange={(e) => setNewFileName(e.target.value)}
                                        placeholder=".env.production"
                                    />
                                </div>
                                <Button
                                    onClick={() => createMutation.mutate()}
                                    disabled={!newFileName || createMutation.isPending}
                                    className="w-full"
                                >
                                    {createMutation.isPending ? "Creating..." : "Create File"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="space-y-1">
                    {envFiles.map((file: any) => (
                        <button
                            key={file.id}
                            onClick={() => setSelectedFileId(file.id)}
                            className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors ${selectedFileId === file.id
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "hover:bg-muted text-muted-foreground"
                                }`}
                        >
                            <FileText className="h-4 w-4" />
                            {file.name}
                        </button>
                    ))}
                    {envFiles.length === 0 && (
                        <p className="text-sm text-muted-foreground px-3 py-2">No files yet</p>
                    )}
                </div>
            </div>
            <div className="col-span-9">
                {selectedFile ? (
                    <EnvEditor
                        projectId={projectId}
                        file={selectedFile}
                        servers={servers}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground border rounded-lg border-dashed">
                        <FileText className="h-8 w-8 mb-2 opacity-50" />
                        <p>Select a file to edit</p>
                    </div>
                )}
            </div>
        </div>
    )
}
