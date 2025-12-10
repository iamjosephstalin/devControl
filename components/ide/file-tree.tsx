"use client"

import * as React from "react"
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
// import { ScrollArea } from "@/components/ui/scroll-area" // Removed as it is missing
import { Button } from "@/components/ui/button"

interface FileNode {
    name: string
    path: string
    type: "file" | "directory"
    children?: FileNode[]
}

interface FileTreeProps {
    files: FileNode[]
    onSelect: (path: string) => void
    selectedPath?: string
}

interface FileTreeNodeProps {
    node: FileNode
    depth: number
    onSelect: (path: string) => void
    selectedPath?: string
    expandedPaths: Set<string>
    toggleExpand: (path: string) => void
}

const FileTreeNode = ({ node, depth, onSelect, selectedPath, expandedPaths, toggleExpand }: FileTreeNodeProps) => {
    const isExpanded = expandedPaths.has(node.path)
    const isSelected = selectedPath === node.path

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (node.type === "directory") {
            toggleExpand(node.path)
        } else {
            onSelect(node.path)
        }
    }

    return (
        <div>
            <div
                className={cn(
                    "flex items-center py-1 px-2 cursor-pointer hover:bg-accent/50 text-sm select-none",
                    isSelected && "bg-accent text-accent-foreground"
                )}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={handleClick}
            >
                <span className="mr-1 text-muted-foreground">
                    {node.type === "directory" ? (
                        isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
                    ) : (
                        <span className="w-3" />
                    )}
                </span>
                <span className="mr-2 text-muted-foreground">
                    {node.type === "directory" ? (
                        isExpanded ? <FolderOpen className="h-4 w-4 text-primary" /> : <Folder className="h-4 w-4 text-primary" />
                    ) : (
                        <File className="h-4 w-4" />
                    )}
                </span>
                <span className="truncate">{node.name}</span>
            </div>
            {node.type === "directory" && isExpanded && node.children && (
                <div>
                    {node.children.map((child) => (
                        <FileTreeNode
                            key={child.path}
                            node={child}
                            depth={depth + 1}
                            onSelect={onSelect}
                            selectedPath={selectedPath}
                            expandedPaths={expandedPaths}
                            toggleExpand={toggleExpand}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export function FileTree({ files, onSelect, selectedPath }: FileTreeProps) {
    const [expandedPaths, setExpandedPaths] = React.useState<Set<string>>(new Set())

    const toggleExpand = (path: string) => {
        const newExpanded = new Set(expandedPaths)
        if (newExpanded.has(path)) {
            newExpanded.delete(path)
        } else {
            newExpanded.add(path)
        }
        setExpandedPaths(newExpanded)
    }

    // Helper to render flat list if needed, but assuming files is flat list of root level with children?
    // Actually, the API returns a flat list of the current directory if we query by directory.
    // But for a tree, we typically want recursive data or load-on-demand.
    // Implementation plan assumed "File Tree". 
    // Let's assume for now the parent component handles fetching children and merging them into the tree structure,
    // OR the API returns a full tree (might be heavy for large repos),
    // OR we support lazy loading. 
    // Given the complexity, lazy loading is better.
    // BUT the component defined here expects `node.children`.
    // I'll stick to a simple recursive render and let the parent manage the data structure.

    return (
        <div className="h-full overflow-auto">
            <div className="pb-4">
                {files.map((node) => (
                    <FileTreeNode
                        key={node.path}
                        node={node}
                        depth={0}
                        onSelect={onSelect}
                        selectedPath={selectedPath}
                        expandedPaths={expandedPaths}
                        toggleExpand={toggleExpand}
                    />
                ))}
            </div>
        </div>
    )
}
