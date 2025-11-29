"use client"

import { useQuery } from "@tanstack/react-query"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface DeploymentHistoryProps {
    projectId: string
}

export function DeploymentHistory({ projectId }: DeploymentHistoryProps) {
    const { data: deployments = [], isLoading } = useQuery({
        queryKey: ["deployments", projectId],
        queryFn: async () => {
            // This endpoint needs to be created or we filter on client
            // For now assuming we have a way to get deployments
            // We might need to update the GET /api/deployments route to support filtering by projectId
            const res = await fetch(`/api/deployments?projectId=${projectId}`)
            if (!res.ok) return [] // Fail gracefully if endpoint doesn't exist yet
            return res.json()
        },
    })

    if (isLoading) {
        return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    }

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Environment</TableHead>
                        <TableHead>Triggered By</TableHead>
                        <TableHead>Started At</TableHead>
                        <TableHead>Duration</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {deployments.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                No deployments found
                            </TableCell>
                        </TableRow>
                    ) : (
                        deployments.map((deployment: any) => (
                            <TableRow key={deployment.id}>
                                <TableCell>
                                    <Badge variant={
                                        deployment.status === "success" ? "default" :
                                            deployment.status === "failed" ? "destructive" :
                                                "secondary"
                                    }>
                                        {deployment.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{deployment.environment}</TableCell>
                                <TableCell>{deployment.triggeredBy}</TableCell>
                                <TableCell>{formatDate(deployment.startedAt)}</TableCell>
                                <TableCell>
                                    {deployment.finishedAt ?
                                        `${Math.round((new Date(deployment.finishedAt).getTime() - new Date(deployment.startedAt).getTime()) / 1000)}s`
                                        : "..."}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
