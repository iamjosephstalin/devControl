"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { Rocket, Loader2 } from "lucide-react"

interface DeployButtonProps {
    projectId: string
}

export function DeployButton({ projectId }: DeployButtonProps) {
    const [open, setOpen] = useState(false)
    const [serverId, setServerId] = useState("")
    const [script, setScript] = useState("cd /var/www/app && git pull && npm install && npm run build && pm2 restart all")

    const { data: servers = [] } = useQuery({
        queryKey: ["servers", projectId],
        queryFn: async () => {
            const res = await fetch(`/api/servers?projectId=${projectId}`)
            if (!res.ok) throw new Error("Failed to fetch servers")
            return res.json()
        },
    })

    const deployMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/deployments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    environment: "production",
                    serverId,
                    script,
                }),
            })
            if (!res.ok) throw new Error("Failed to trigger deployment")
            return res.json()
        },
        onSuccess: () => {
            setOpen(false)
            // Ideally redirect to deployment details or show toast
        },
    })

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Rocket className="mr-2 h-4 w-4" />
                    Deploy
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Deploy Project</DialogTitle>
                    <DialogDescription>
                        Trigger a deployment on your server
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label>Target Server</Label>
                        <Select value={serverId} onValueChange={setServerId}>
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
                        <Label>Deployment Script</Label>
                        <Textarea
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                            className="font-mono h-32"
                        />
                    </div>
                    <Button
                        className="w-full"
                        onClick={() => deployMutation.mutate()}
                        disabled={!serverId || deployMutation.isPending}
                    >
                        {deployMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deploying...
                            </>
                        ) : (
                            "Start Deployment"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
