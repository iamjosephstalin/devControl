"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useQuery, useMutation } from "@tanstack/react-query"
import { FileTree } from "@/components/ide/file-tree"
import { CodeEditor } from "@/components/ide/editor"
import { GitPanel } from "@/components/ide/git-panel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Save, Terminal } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { useRouter } from "next/navigation"
import { ArrowLeft, X } from "lucide-react"

export default function IDEPage() {
    const params = useParams()
    const router = useRouter()
    const workspaceId = params.workspaceId as string

    // Tabs state
    const [openFiles, setOpenFiles] = React.useState<string[]>([])
    const [activeFile, setActiveFile] = React.useState<string | null>(null)

    // Content cache (path -> content)
    const [fileContents, setFileContents] = React.useState<Record<string, string>>({})
    const [unsavedContents, setUnsavedContents] = React.useState<Record<string, string>>({})

    // Fetch files (tree)
    const { data: files = [], isLoading: filesLoading } = useQuery({
        queryKey: ['files', workspaceId],
        queryFn: async () => {
            const res = await fetch(`/api/ide/files?workspaceId=${workspaceId}&path=.`)
            if (!res.ok) throw new Error("Failed to fetch files")
            return res.json()
        }
    })

    // Fetch content when active file changes
    const { data: content } = useQuery({
        queryKey: ['file-content', workspaceId, activeFile],
        queryFn: async () => {
            if (!activeFile) return null
            // Check cache first (optional, but good for perf)
            if (fileContents[activeFile]) return fileContents[activeFile]

            const res = await fetch(`/api/ide/files?workspaceId=${workspaceId}&path=${encodeURIComponent(activeFile)}`)
            if (!res.ok) throw new Error("Failed to fetch content")
            const data = await res.json()
            return data.content
        },
        enabled: !!activeFile
    })

    // Update caches when content loads
    React.useEffect(() => {
        if (activeFile && content !== undefined && content !== null) {
            setFileContents(prev => ({ ...prev, [activeFile]: content }))
        }
    }, [content, activeFile])

    const handleFileSelect = (path: string) => {
        if (!openFiles.includes(path)) {
            setOpenFiles([...openFiles, path])
        }
        setActiveFile(path)
    }

    const closeFile = (e: React.MouseEvent, path: string) => {
        e.stopPropagation()
        const newOpen = openFiles.filter(f => f !== path)
        setOpenFiles(newOpen)

        // Remove from unsaved/cache if desired, or keep?
        // Let's keep for now to avoid losing work if re-opened, 
        // but typically closing might prompt to save. 
        // For simplicity: just close tab.

        if (activeFile === path) {
            setActiveFile(newOpen.length > 0 ? newOpen[newOpen.length - 1] : null)
        }
    }

    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined && activeFile) {
            setUnsavedContents(prev => ({ ...prev, [activeFile]: value }))
        }
    }

    const { mutate: saveFile, isPending: isSaving } = useMutation({
        mutationFn: async () => {
            if (!activeFile) return
            const contentToSave = unsavedContents[activeFile]
            if (contentToSave === undefined) return // No changes

            const res = await fetch('/api/ide/files', {
                method: 'POST',
                body: JSON.stringify({
                    workspaceId,
                    path: activeFile,
                    content: contentToSave
                })
            })

            if (!res.ok) throw new Error("Failed to save")
            return res.json()
        },
        onSuccess: () => {
            toast.success("File saved")
            if (activeFile && unsavedContents[activeFile] !== undefined) {
                setFileContents(prev => ({ ...prev, [activeFile]: unsavedContents[activeFile] }))
                const newUnsaved = { ...unsavedContents }
                delete newUnsaved[activeFile]
                setUnsavedContents(newUnsaved)
            }
        },
        onError: () => {
            toast.error("Failed to save file")
        }
    })

    // Handle keyboard shortcut for save
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault()
                saveFile()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [saveFile])

    const isDirty = (path: string) => {
        return unsavedContents[path] !== undefined && unsavedContents[path] !== fileContents[path]
    }

    const currentContent = activeFile ? (unsavedContents[activeFile] ?? fileContents[activeFile] ?? "") : ""

    return (
        <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
            {/* Header */}
            <header className="flex h-14 items-center justify-between border-b px-4 bg-muted/20">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/version-control')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-mono font-bold">DevControl IDE</span>
                    <Badge variant="outline" className="font-mono">{workspaceId.substring(0, 8)}</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        onClick={() => saveFile()}
                        disabled={!activeFile || !isDirty(activeFile) || isSaving}
                    >
                        <Save className="mr-2 h-4 w-4" />
                        Save
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* File Tree Sidebar */}
                <aside className="w-64 border-r flex flex-col bg-muted/5">
                    <div className="p-2 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Explorer
                    </div>
                    <div className="flex-1 overflow-auto">
                        <FileTree
                            files={files}
                            onSelect={handleFileSelect}
                            selectedPath={activeFile || undefined}
                        />
                    </div>
                </aside>

                {/* Editor Area */}
                <main className="flex-1 flex flex-col min-w-0 bg-background">
                    {/* Tabs */}
                    {openFiles.length > 0 && (
                        <div className="flex h-9 border-b bg-muted/10 overflow-x-auto no-scrollbar">
                            {openFiles.map(path => (
                                <div
                                    key={path}
                                    className={cn(
                                        "flex items-center px-3 py-2 text-sm border-r cursor-pointer min-w-[120px] max-w-[200px] group select-none",
                                        activeFile === path ? "bg-background font-medium border-t-2 border-t-primary" : "hover:bg-muted/20 text-muted-foreground"
                                    )}
                                    onClick={() => setActiveFile(path)}
                                >
                                    <span className="truncate flex-1 mr-2">{path}</span>
                                    {isDirty(path) && <span className="mr-2 text-xs">●</span>}
                                    <div
                                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded-sm hover:bg-muted/50"
                                        onClick={(e) => closeFile(e, path)}
                                    >
                                        <X className="h-3 w-3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeFile ? (
                        <CodeEditor
                            path={activeFile}
                            value={currentContent}
                            onChange={handleEditorChange}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <div className="text-center">
                                <Terminal className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>Select a file to start editing</p>
                            </div>
                        </div>
                    )}
                </main>

                {/* Right Panel (Git) */}
                <aside className="w-72 border-l flex flex-col bg-muted/5">
                    <GitPanel workspaceId={workspaceId} />
                </aside>
            </div>

            {/* Status Bar */}
            <footer className="h-6 border-t flex items-center px-4 text-xs text-muted-foreground bg-primary-foreground">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Ready</span>
                </div>
                {activeFile && (
                    <div className="ml-auto flex gap-4">
                        <span>{activeFile}</span>
                        <span>{isDirty(activeFile) ? 'Unsaved' : 'Saved'}</span>
                    </div>
                )}
            </footer>
        </div>
    )
}
