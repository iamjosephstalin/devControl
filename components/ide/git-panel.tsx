"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Check, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface GitPanelProps {
    workspaceId: string
}

export function GitPanel({ workspaceId }: GitPanelProps) {
    const queryClient = useQueryClient()
    const [commitMessage, setCommitMessage] = React.useState("")

    const { data: status, isLoading, refetch } = useQuery({
        queryKey: ['git-status', workspaceId],
        queryFn: async () => {
            const res = await fetch(`/api/ide/git?workspaceId=${workspaceId}`)
            if (!res.ok) throw new Error("Failed to fetch status")
            return res.json()
        },
        // Refresh every 10 seconds or when window focused
        refetchOnWindowFocus: true,
    })

    const { mutate: performGitAction, isPending } = useMutation({
        mutationFn: async (vars: { action: string, files?: string[], message?: string }) => {
            const res = await fetch('/api/ide/git', {
                method: 'POST',
                body: JSON.stringify({ workspaceId, ...vars })
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.details || "Git action failed")
            }
            return res.json()
        },
        onSuccess: (data) => {
            toast.success(data.message)
            setCommitMessage("")
            refetch()
        },
        onError: (error: Error) => {
            toast.error(error.message)
        }
    })

    // Group files
    const staged = status?.staged || []
    const modified = status?.modified || []
    const not_added = status?.not_added || []
    const created = status?.created || []
    const deleted = status?.deleted || []

    const untracked = [...not_added, ...created]
    const changed = [...modified, ...deleted]

    const hasChanges = changed.length > 0 || untracked.length > 0
    const hasStaged = staged.length > 0

    return (
        <div className="h-full flex flex-col p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Source Control</h3>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => performGitAction({ action: 'pull' })} disabled={isPending} title="Pull">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] leading-3">↓</span>
                            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                        </div>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => performGitAction({ action: 'push' })} disabled={isPending} title="Push">
                        <div className="flex flex-col items-center">
                            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                            <span className="text-[10px] leading-3">↑</span>
                        </div>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isLoading} title="Refresh Status">
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto space-y-6">
                {/* Staged Changes */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase">Staged Changes</h4>
                    </div>
                    {staged.length === 0 ? (
                        <div className="text-sm text-muted-foreground italic">No staged changes</div>
                    ) : (
                        <div className="space-y-1">
                            {staged.map((file: string) => (
                                <div key={file} className="text-sm flex items-center p-1 hover:bg-muted/50 rounded">
                                    <Check className="h-3 w-3 mr-2 text-green-500" />
                                    <span className="truncate">{file}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Changes */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase">Changes</h4>
                        {hasChanges && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => performGitAction({ action: 'add' })}
                                disabled={isPending}
                            >
                                Stage All
                            </Button>
                        )}
                    </div>
                    {!hasChanges ? (
                        <div className="text-sm text-muted-foreground italic">No changes</div>
                    ) : (
                        <div className="space-y-1">
                            {changed.map((file: string) => (
                                <div key={file} className="text-sm flex items-center p-1 hover:bg-muted/50 rounded group">
                                    <span className="text-yellow-500 mr-2 font-mono text-xs">M</span>
                                    <span className="truncate flex-1">{file}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                        onClick={() => performGitAction({ action: 'add', files: [file] })}
                                    >
                                        +
                                    </Button>
                                </div>
                            ))}
                            {untracked.map((file: string) => (
                                <div key={file} className="text-sm flex items-center p-1 hover:bg-muted/50 rounded group">
                                    <span className="text-green-500 mr-2 font-mono text-xs">U</span>
                                    <span className="truncate flex-1">{file}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                        onClick={() => performGitAction({ action: 'add', files: [file] })}
                                    >
                                        +
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
                <Textarea
                    placeholder="Commit message"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    rows={3}
                />
                <Button
                    className="w-full"
                    disabled={!hasStaged || !commitMessage || isPending}
                    onClick={() => performGitAction({ action: 'commit', message: commitMessage })}
                >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                    Commit
                </Button>
            </div>
        </div>
    )
}
