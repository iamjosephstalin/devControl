"use client"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Save, RefreshCw, Loader2, Server } from "lucide-react"
import { toast } from "sonner"

interface EnvEditorProps {
    projectId: string
    file: any
    servers: any[]
}

export function EnvEditor({ projectId, file, servers }: EnvEditorProps) {
    const [content, setContent] = useState(file.value || "")
    const [isSyncOpen, setIsSyncOpen] = useState(false)
    const [selectedServer, setSelectedServer] = useState("")
    const [syncPath, setSyncPath] = useState("")
    const queryClient = useQueryClient()

    useEffect(() => {
        setContent(file.value || "")
    }, [file])

    const saveMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/projects/${projectId}/env`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: file.id, content }),
            })
            if (!res.ok) throw new Error("Failed to save env file")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["env-files", projectId] })
            toast.success("Environment file saved")
        },
        onError: () => {
            toast.error("Failed to save environment file")
        }
    })

    const syncMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/projects/${projectId}/env/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    envFileId: file.id,
                    serverId: selectedServer,
                    path: syncPath
                }),
            })
            if (!res.ok) throw new Error("Failed to sync env file")
            return res.json()
        },
        onSuccess: () => {
            setIsSyncOpen(false)
            toast.success("Environment file synced to server")
        },
        onError: () => {
            toast.error("Failed to sync environment file")
        }
    })

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium font-mono">{file.name}</h3>
                <div className="flex items-center gap-2">
                    <Dialog open={isSyncOpen} onOpenChange={setIsSyncOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Sync to Server
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Sync {file.name}</DialogTitle>
                                <DialogDescription>
                                    Deploy this environment file to a server
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label>Target Server</Label>
                                    <Select value={selectedServer} onValueChange={setSelectedServer}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a server" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {servers.map((server: any) => (
                                                <SelectItem key={server.id} value={server.id}>
                                                    {server.name} ({server.host})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Remote Path (Optional)</Label>
                                    <input
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="/var/www/app/.env"
                                        value={syncPath}
                                        onChange={(e) => setSyncPath(e.target.value)}
                                    />
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={() => syncMutation.mutate()}
                                    disabled={!selectedServer || syncMutation.isPending}
                                >
                                    {syncMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Syncing...
                                        </>
                                    ) : (
                                        "Sync Now"
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button
                        size="sm"
                        onClick={() => saveMutation.mutate()}
                        disabled={saveMutation.isPending}
                    >
                        {saveMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Save
                    </Button>
                </div>
            </div>
            <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="font-mono min-h-[400px] bg-slate-950 text-slate-50 border-slate-800"
                spellCheck={false}
            />
        </div>
    )
}
